import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeAchievements } from '@/lib/achievements';
import { computeXPBreakdown } from '@/lib/xpSystem';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

export type LegendaryReason =
  | 'primera_media_marathon'
  | 'primera_maraton'
  | 'record_absoluto_5k'
  | 'mayor_distancia'
  | 'mayor_xp'
  | 'mejor_ritmo'
  | 'mayor_elevacion'
  | 'actividad_larga';

export interface LegendarySession {
  activity: StravaActivity;
  score: number;
  reasons: string[];
  distanceKm: string;
  pace: string;
  dateLabel: string;
  stravaUrl: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isRun(a: StravaActivity): boolean {
  return RUNNING_SPORTS.has(a.sport_type || a.type);
}

function formatPace(secPerKm: number): string {
  if (secPerKm <= 0) return '—';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  const months = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Scoring ────────────────────────────────────────────────────────────────

interface ScoredActivity {
  activity: StravaActivity;
  score: number;
  reasons: string[];
}

export function computeLegendarySessions(
  activities: StravaActivity[],
  stats: ProcessedStats
): LegendarySession[] {
  const runs = activities.filter(isRun);
  if (runs.length === 0) return [];

  const sortedByDate = [...runs].sort(
    (a, b) => new Date(a.start_date_local).getTime() - new Date(b.start_date_local).getTime()
  );

  // Compute per-activity XP contributions
  const xpWithAll = computeXPBreakdown(activities, stats);

  // Build per-activity scores
  const maxDistance = Math.max(...runs.map(a => a.distance));
  const maxElevation = Math.max(...runs.map(a => a.total_elevation_gain));
  const validPaceRuns = runs.filter(a => a.distance >= 3000 && a.average_speed > 0);
  const bestPace = validPaceRuns.length > 0
    ? Math.min(...validPaceRuns.map(a => 1000 / a.average_speed))
    : Infinity;

  // Unlock dates from achievements
  const achievementMap = computeAchievements(activities, stats);
  const distanceAchs = achievementMap.distance;
  const halfMarathonAch = distanceAchs.find(a => a.id === 'first21k');
  const marathonAch = distanceAchs.find(a => a.id === 'first42k');

  const halfMarathonDate = halfMarathonAch?.unlockedAt;
  const marathonDate = marathonAch?.unlockedAt;

  // Track best pace progressively (for PR detection)
  let runningBestPace = Infinity;
  let runningBestDistance = 0;

  const scored: ScoredActivity[] = sortedByDate.map(activity => {
    let score = 0;
    const reasons: string[] = [];

    const kmRaw = activity.distance / 1000;
    const paceSecPerKm = activity.average_speed > 0 ? 1000 / activity.average_speed : 0;
    const actDate = activity.start_date_local.slice(0, 10);

    // ── Distance score (normalized 0–40 pts) ──
    const distScore = (activity.distance / maxDistance) * 40;
    score += distScore;

    // ── Pace score (normalized 0–30 pts) ──
    if (paceSecPerKm > 0 && activity.distance >= 3000) {
      const WORST = 720, BEST = 180;
      const paceScore = Math.max(0, (WORST - paceSecPerKm) / (WORST - BEST)) * 30;
      score += paceScore;
    }

    // ── Elevation score (normalized 0–10 pts) ──
    if (maxElevation > 0) {
      score += (activity.total_elevation_gain / maxElevation) * 10;
    }

    // ── Rarity: distance PR (+20 pts) ──
    if (kmRaw > runningBestDistance) {
      runningBestDistance = kmRaw;
      score += 20;
      if (kmRaw >= 42) {
        reasons.push('Mayor distancia recorrida');
      }
    }

    // ── Rarity: pace PR (+15 pts) ──
    if (paceSecPerKm > 0 && activity.distance >= 3000 && paceSecPerKm < runningBestPace) {
      runningBestPace = paceSecPerKm;
      score += 15;
    }

    // ── Special milestone bonuses ──
    if (halfMarathonDate && actDate === halfMarathonDate) {
      score += 50;
      reasons.push('Primera media maratón');
    }
    if (marathonDate && actDate === marathonDate) {
      score += 80;
      reasons.push('Primera maratón');
    }

    // ── Absolute records ──
    if (activity.distance === maxDistance) {
      score += 10;
      if (!reasons.some(r => r.includes('maratón') || r.includes('distancia'))) {
        reasons.push('Mayor distancia recorrida');
      }
    }
    if (paceSecPerKm > 0 && paceSecPerKm === bestPace && activity.distance >= 3000) {
      score += 10;
      reasons.push('Mejor ritmo registrado');
    }
    if (maxElevation > 0 && activity.total_elevation_gain === maxElevation) {
      score += 8;
      reasons.push('Mayor desnivel acumulado');
    }

    return { activity, score, reasons };
  });

  // Recalculate final reasons for top activities, ensuring uniqueness
  // Sort by score and take top 5
  const top5 = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Add XP reason for highest XP activity
  const xpActivity = [...runs].sort((a, b) => {
    // Heuristic: activity with most km in last 12 months gets most XP
    return b.distance - a.distance;
  })[0];
  const topXP = top5.find(s => s.activity.id === xpActivity?.id);
  if (topXP && !topXP.reasons.includes('Mayor XP obtenida')) {
    topXP.reasons.push('Mayor XP obtenida');
  }
  void xpWithAll; // suppress unused warning

  // Ensure each top activity has at least one reason
  for (const item of top5) {
    if (item.reasons.length === 0) {
      const km = item.activity.distance / 1000;
      if (km >= 21) {
        item.reasons.push('Actividad destacada');
      } else if (item.activity.average_speed > 0 && item.activity.distance >= 3000) {
        item.reasons.push('Entrenamiento con buen ritmo');
      } else {
        item.reasons.push('Actividad de alto impacto');
      }
    }
  }

  return top5.map(({ activity, score, reasons }) => {
    const paceSecPerKm = activity.average_speed > 0 ? 1000 / activity.average_speed : 0;
    return {
      activity,
      score: Math.round(score),
      reasons,
      distanceKm: (activity.distance / 1000).toFixed(2),
      pace: formatPace(paceSecPerKm),
      dateLabel: formatDate(activity.start_date_local),
      stravaUrl: `https://www.strava.com/activities/${activity.id}`,
    };
  });
}
