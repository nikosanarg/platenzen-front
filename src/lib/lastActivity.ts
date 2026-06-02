import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeXPBreakdown, getLevelInfo } from '@/lib/xpSystem';
import { computeRunnerDNA } from '@/lib/runnerDNA';
import { computeAchievements } from '@/lib/achievements';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

export interface XPDetail {
  label: string;
  value: number;
}

export interface DNAImpact {
  attribute: string;
  delta: number;
}

export interface SimilarActivityComparison {
  label: string;   // e.g. "4m más rápido que tu última media maratón"
  positive: boolean;
}

export interface NewAchievement {
  name: string;
  category: string;
}

export interface EnrichedLastActivity {
  activity: StravaActivity;
  distanceKm: string;
  pace: string;      // mm:ss/km
  durationLabel: string;
  dateLabel: string;
  stravaUrl: string;

  xpEarned: number;
  xpDetails: XPDetail[];

  dnaImpact: DNAImpact[];

  prevLevel: number | null;  // non-null if level changed
  currentLevel: number;

  comparison: SimilarActivityComparison | null;

  newAchievements: NewAchievement[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isRun(a: StravaActivity): boolean {
  return RUNNING_SPORTS.has(a.sport_type || a.type);
}

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  const months = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function computeXPForActivity(activity: StravaActivity, allActivities: StravaActivity[], stats: ProcessedStats): {
  total: number;
  details: XPDetail[];
} {
  // Compute XP with and without the activity to get the delta
  const withoutActivity = allActivities.filter(a => a.id !== activity.id);
  const xpWith = computeXPBreakdown(allActivities, stats);
  const xpWithout = computeXPBreakdown(withoutActivity, stats);

  const total = Math.max(0, xpWith.total - xpWithout.total);

  const details: XPDetail[] = [];

  const kmDelta = (xpWith.fromKm - xpWithout.fromKm);
  if (kmDelta > 0) details.push({ label: `+${(activity.distance / 1000).toFixed(1)} km recorridos`, value: kmDelta });

  const msDelta = xpWith.fromMilestones - xpWithout.fromMilestones;
  if (msDelta > 0) details.push({ label: 'nuevo hito de distancia', value: msDelta });

  const prDelta = xpWith.fromPRs - xpWithout.fromPRs;
  if (prDelta > 0) details.push({ label: 'récord personal', value: prDelta });

  const wrDelta = xpWith.fromWeeklyRecords - xpWithout.fromWeeklyRecords;
  if (wrDelta > 0) details.push({ label: 'semana récord', value: wrDelta });

  const cwDelta = xpWith.fromCompleteWeeks - xpWithout.fromCompleteWeeks;
  if (cwDelta > 0) details.push({ label: 'semana consistente', value: cwDelta });

  const achDelta = xpWith.fromAchievements - xpWithout.fromAchievements;
  if (achDelta > 0) details.push({ label: 'logros desbloqueados', value: achDelta });

  return { total, details };
}

function computeDNAImpact(activity: StravaActivity, allActivities: StravaActivity[], stats: ProcessedStats): DNAImpact[] {
  const withDNA = computeRunnerDNA(allActivities, stats);
  const withoutDNA = computeRunnerDNA(allActivities.filter(a => a.id !== activity.id), stats);

  const LABELS: Record<string, string> = {
    resistencia: 'Resistencia',
    velocidad: 'Velocidad',
    consistencia: 'Consistencia',
    exploracion: 'Exploración',
    logros: 'Logros',
  };

  const impacts: DNAImpact[] = [];
  for (const key of Object.keys(LABELS)) {
    const k = key as keyof typeof withDNA;
    const delta = withDNA[k] - withoutDNA[k];
    if (delta !== 0) {
      impacts.push({ attribute: LABELS[key], delta });
    }
  }
  return impacts.filter(i => i.delta !== 0);
}

function computeSimilarComparison(
  activity: StravaActivity,
  allActivities: StravaActivity[]
): SimilarActivityComparison | null {
  if (activity.distance < 1000 || activity.moving_time <= 0) return null;

  const kmThis = activity.distance / 1000;
  const paceThis = activity.moving_time / (activity.distance / 1000);

  // Find most recent similar activity (±5 km range, not this activity)
  const similar = allActivities
    .filter(a =>
      a.id !== activity.id &&
      isRun(a) &&
      a.distance >= 1000 &&
      a.moving_time > 0 &&
      Math.abs(a.distance / 1000 - kmThis) <= 5
    )
    .sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime());

  if (similar.length === 0) return null;

  const prev = similar[0];
  const pacePrev = prev.moving_time / (prev.distance / 1000);
  const paceDiff = paceThis - pacePrev; // negative = faster

  if (Math.abs(paceDiff) < 1) return null; // too small to mention

  const absDiff = Math.abs(paceDiff);
  const minutes = Math.floor(absDiff / 60);
  const seconds = Math.round(absDiff % 60);
  const faster = paceDiff < 0;

  let label: string;
  if (minutes > 0 && seconds > 0) {
    label = `${minutes}m ${seconds}s ${faster ? 'más rápido' : 'más lento'} que tu última actividad similar`;
  } else if (minutes > 0) {
    label = `${minutes}m ${faster ? 'más rápido' : 'más lento'} que tu última actividad similar`;
  } else {
    label = `${seconds}s/km ${faster ? 'más rápido' : 'más lento'} que tu última actividad similar`;
  }

  return { label, positive: faster };
}

function computeNewAchievements(
  activity: StravaActivity,
  allActivities: StravaActivity[],
  stats: ProcessedStats
): NewAchievement[] {
  const withMap = computeAchievements(allActivities, stats);
  const withoutMap = computeAchievements(allActivities.filter(a => a.id !== activity.id), stats);

  const newOnes: NewAchievement[] = [];
  for (const [category, achievements] of Object.entries(withMap)) {
    const withoutList = withoutMap[category as keyof typeof withoutMap];
    for (const ach of achievements) {
      const wasUnlocked = withoutList.find(a => a.id === ach.id)?.unlocked ?? false;
      if (ach.unlocked && !wasUnlocked) {
        newOnes.push({ name: ach.name, category });
      }
    }
  }
  return newOnes;
}

// ── Main export ────────────────────────────────────────────────────────────

export function computeEnrichedLastActivity(
  activities: StravaActivity[],
  stats: ProcessedStats
): EnrichedLastActivity | null {
  const runs = activities.filter(isRun);
  if (runs.length === 0) return null;

  // Most recent run
  const sorted = [...runs].sort(
    (a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime()
  );
  const activity = sorted[0];

  const kmRaw = activity.distance / 1000;
  const distanceKm = kmRaw.toFixed(2);
  const paceSecPerKm = activity.average_speed > 0 ? 1000 / activity.average_speed : 0;
  const pace = paceSecPerKm > 0 ? formatPace(paceSecPerKm) : '—';
  const durationLabel = formatDuration(activity.moving_time);
  const dateLabel = formatDate(activity.start_date_local);
  const stravaUrl = `https://www.strava.com/activities/${activity.id}`;

  const xpInfo = computeXPForActivity(activity, activities, stats);

  const dnaImpact = computeDNAImpact(activity, activities, stats);

  // Level comparison
  const withLevel = getLevelInfo(activities, stats);
  const withoutLevel = getLevelInfo(activities.filter(a => a.id !== activity.id), stats);
  const prevLevel = withoutLevel.level !== withLevel.level ? withoutLevel.level : null;
  const currentLevel = withLevel.level;

  const comparison = computeSimilarComparison(activity, activities);

  const newAchievements = computeNewAchievements(activity, activities, stats);

  return {
    activity,
    distanceKm,
    pace,
    durationLabel,
    dateLabel,
    stravaUrl,
    xpEarned: xpInfo.total,
    xpDetails: xpInfo.details,
    dnaImpact,
    prevLevel,
    currentLevel,
    comparison,
    newAchievements,
  };
}
