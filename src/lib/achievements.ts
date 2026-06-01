import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

export type AchievementCategory = 'distance' | 'volume' | 'consistency' | 'speed' | 'exploration';

export interface Achievement {
  id: string;
  name: string;
  category: AchievementCategory;
  description: string;
  xp: number;
  unlocked: boolean;
  unlockedAt: string | null; // ISO date YYYY-MM-DD
  unlockedReason: string;
  progress: number; // 0–1 if not unlocked
  progressText: string;
}

export type AchievementMap = Record<AchievementCategory, Achievement[]>;

// ── Helpers ────────────────────────────────────────────────────────────────

function runs(activities: StravaActivity[]): StravaActivity[] {
  return activities.filter(a => RUNNING_SPORTS.has(a.sport_type || a.type));
}

function sortedAsc(acts: StravaActivity[]): StravaActivity[] {
  return [...acts].sort(
    (a, b) => new Date(a.start_date_local).getTime() - new Date(b.start_date_local).getTime()
  );
}

function formatDate(iso: string): string {
  const [y, mo, d] = iso.slice(0, 10).split('-').map(Number);
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${d} de ${months[mo - 1]} de ${y}`;
}

function pct(current: number, target: number): number {
  return Math.min(current / target, 1);
}

function progressText(current: number, target: number, unit: string): string {
  return `${Math.min(Math.round(current), target)} / ${target} ${unit}`;
}

// ── Distance achievements ──────────────────────────────────────────────────

function computeDistanceAchievements(allRuns: StravaActivity[]): Achievement[] {
  const sorted = sortedAsc(allRuns);

  const milestones: Array<{ id: string; name: string; km: number; xp: number; desc: string }> = [
    { id: 'first5k', name: 'Primer 5K', km: 5, xp: 100, desc: 'Completar una salida de 5 km' },
    { id: 'first10k', name: 'Primer 10K', km: 10, xp: 200, desc: 'Completar una salida de 10 km' },
    { id: 'first15k', name: 'Primer 15K', km: 15, xp: 300, desc: 'Completar una salida de 15 km' },
    { id: 'first21k', name: 'Primera media maratón', km: 21.1, xp: 500, desc: 'Completar 21.1 km en una sola salida' },
    { id: 'first31k', name: 'Primer 31K', km: 31.5, xp: 600, desc: 'Completar una salida de 31.5 km' },
    { id: 'first42k', name: 'Primera maratón', km: 42.2, xp: 1000, desc: 'Completar 42.2 km en una sola salida' },
  ];

  const maxKmReached = sorted.reduce((max, a) => Math.max(max, a.distance / 1000), 0);

  return milestones.map(m => {
    const firstRun = sorted.find(a => a.distance / 1000 >= m.km);
    const unlocked = !!firstRun;
    const date = firstRun?.start_date_local.slice(0, 10) ?? null;
    return {
      id: m.id,
      name: m.name,
      category: 'distance',
      description: m.desc,
      xp: m.xp,
      unlocked,
      unlockedAt: date,
      unlockedReason: date ? `Desbloqueado el ${formatDate(date)} al completar ${m.km} km.` : m.desc,
      progress: pct(maxKmReached, m.km),
      progressText: `${maxKmReached.toFixed(1)} / ${m.km} km`,
    };
  });
}

// ── Volume achievements ────────────────────────────────────────────────────

function computeVolumeAchievements(allRuns: StravaActivity[]): Achievement[] {
  const sorted = sortedAsc(allRuns);
  const targets = [
    { id: 'vol100', name: '100 km acumulados', target: 100, xp: 150 },
    { id: 'vol250', name: '250 km acumulados', target: 250, xp: 200 },
    { id: 'vol500', name: '500 km acumulados', target: 500, xp: 300 },
    { id: 'vol1000', name: '1000 km acumulados', target: 1000, xp: 500 },
    { id: 'vol2500', name: '2500 km acumulados', target: 2500, xp: 750 },
    { id: 'vol5000', name: '5000 km acumulados', target: 5000, xp: 1000 },
  ];

  // Build cumulative km to find unlock dates
  const cumulative: Array<{ date: string; km: number }> = [];
  let acc = 0;
  for (const a of sorted) {
    acc += a.distance / 1000;
    cumulative.push({ date: a.start_date_local.slice(0, 10), km: acc });
  }

  const totalKm = acc;

  return targets.map(t => {
    const entry = cumulative.find(c => c.km >= t.target);
    const unlocked = !!entry;
    return {
      id: t.id,
      name: t.name,
      category: 'volume',
      description: `Acumular ${t.target} km en el historial total`,
      xp: t.xp,
      unlocked,
      unlockedAt: entry?.date ?? null,
      unlockedReason: entry
        ? `Desbloqueado el ${formatDate(entry.date)} al superar ${t.target} km acumulados.`
        : `Acumulá ${t.target} km en total.`,
      progress: pct(totalKm, t.target),
      progressText: progressText(totalKm, t.target, 'km'),
    };
  });
}

// ── Consistency achievements ───────────────────────────────────────────────

interface WeekGroup {
  week: string;
  count: number;
}

function groupByWeek(acts: StravaActivity[]): WeekGroup[] {
  const map = new Map<string, number>();
  for (const a of acts) {
    const d = new Date(a.start_date_local);
    const diff = (d.getDay() + 6) % 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - diff);
    const key = mon.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

function computeConsistencyAchievements(allRuns: StravaActivity[], stats: ProcessedStats): Achievement[] {
  const sorted = sortedAsc(allRuns);
  const totalActivities = sorted.length;
  const weeks = groupByWeek(sorted);

  // Activity count milestones
  const actTargets = [
    { id: 'act10', name: '10 actividades', target: 10, xp: 100 },
    { id: 'act25', name: '25 actividades', target: 25, xp: 150 },
    { id: 'act50', name: '50 actividades', target: 50, xp: 200 },
    { id: 'act100', name: '100 actividades', target: 100, xp: 350 },
    { id: 'act200', name: '200 actividades', target: 200, xp: 500 },
  ];

  const actAchievements: Achievement[] = actTargets.map(t => {
    const unlockActivity = sorted[t.target - 1];
    const unlocked = totalActivities >= t.target;
    const date = unlockActivity?.start_date_local.slice(0, 10) ?? null;
    return {
      id: t.id,
      name: t.name,
      category: 'consistency',
      description: `Registrar ${t.target} actividades de running`,
      xp: t.xp,
      unlocked,
      unlockedAt: date,
      unlockedReason: date
        ? `Desbloqueado el ${formatDate(date)} al completar tu actividad número ${t.target}.`
        : `Completá ${t.target} actividades de running.`,
      progress: pct(totalActivities, t.target),
      progressText: progressText(totalActivities, t.target, 'actividades'),
    };
  });

  const maxWeekCount = weeks.reduce((m, w) => Math.max(m, w.count), 0);

  // ── Weekly frequency stepper ──────────────────────────────────
  const weekTargets = [
    { id: 'week3', name: 'Primera semana triple', n: 3, xp: 100 },
    { id: 'week4', name: 'Semana de poker', n: 4, xp: 150 },
    { id: 'week5', name: 'Semana de 5 salidas', n: 5, xp: 200 },
    { id: 'week6', name: 'Sextusemanal', n: 6, xp: 300 },
    { id: 'week7', name: 'Semana completa', n: 7, xp: 500 },
  ];

  const weekAchievements: Achievement[] = weekTargets.map(t => {
    const firstWeek = weeks.find(w => w.count >= t.n);
    const date = firstWeek?.week ?? null;
    return {
      id: t.id,
      name: t.name,
      category: 'consistency',
      description: `${t.n} o más salidas en una misma semana`,
      xp: t.xp,
      unlocked: !!firstWeek,
      unlockedAt: date,
      unlockedReason: date
        ? `Desbloqueado la semana del ${formatDate(date)} con ${firstWeek!.count} salidas.`
        : `Completá ${t.n} salidas en una misma semana.`,
      progress: Math.min(maxWeekCount / t.n, 1),
      progressText: `${Math.min(maxWeekCount, t.n)} / ${t.n} salidas`,
    };
  });

  // ── Monthly activity stepper ──────────────────────────────────
  const monthlyCounts = new Map<string, number>();
  for (const a of sorted) {
    const mo = a.start_date_local.slice(0, 7);
    monthlyCounts.set(mo, (monthlyCounts.get(mo) ?? 0) + 1);
  }
  const bestMonthCount = [...monthlyCounts.values()].reduce((m, n) => Math.max(m, n), 0);
  const sortedMonths = [...monthlyCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const monthTargets = [
    { id: 'month8', name: 'Mes de 8 actividades', n: 8, xp: 200 },
    { id: 'month12', name: 'Mes de 12 actividades', n: 12, xp: 300 },
    { id: 'month16', name: 'Mes de 16 actividades', n: 16, xp: 500 },
    { id: 'month20', name: 'Mes ultra activo', n: 20, xp: 750 },
  ];

  const monthAchievements: Achievement[] = monthTargets.map(t => {
    const firstMonth = sortedMonths.find(([, count]) => count >= t.n);
    const date = firstMonth ? firstMonth[0] + '-01' : null;
    return {
      id: t.id,
      name: t.name,
      category: 'consistency',
      description: `${t.n} o más actividades en un mismo mes`,
      xp: t.xp,
      unlocked: !!firstMonth,
      unlockedAt: date,
      unlockedReason: date
        ? `Desbloqueado en ${formatDate(date)} al completar ${t.n} actividades en un mes.`
        : `Completá ${t.n} actividades en un mismo mes.`,
      progress: Math.min(bestMonthCount / t.n, 1),
      progressText: `${Math.min(bestMonthCount, t.n)} / ${t.n} actividades`,
    };
  });

  return [...actAchievements, ...weekAchievements, ...monthAchievements];
}

// ── Speed achievements ─────────────────────────────────────────────────────

function computeSpeedAchievements(allRuns: StravaActivity[]): Achievement[] {
  const targets = [
    { id: 'pace600', name: 'Ritmo menor a 6:00/km', threshold: 360, xp: 100 },
    { id: 'pace530', name: 'Ritmo menor a 5:30/km', threshold: 330, xp: 150 },
    { id: 'pace500', name: 'Ritmo menor a 5:00/km', threshold: 300, xp: 250 },
    { id: 'pace430', name: 'Ritmo menor a 4:30/km', threshold: 270, xp: 400 },
    { id: 'pace400', name: 'Ritmo menor a 4:00/km', threshold: 240, xp: 600 },
  ];

  const sorted = sortedAsc(allRuns.filter(a => a.distance >= 3000 && a.average_speed > 0));
  const bestPace = sorted.reduce((best, a) => {
    const pace = 1000 / a.average_speed;
    return pace < best ? pace : best;
  }, Infinity);

  return targets.map(t => {
    const firstRun = sorted.find(a => 1000 / a.average_speed <= t.threshold);
    const unlocked = !!firstRun;
    const date = firstRun?.start_date_local.slice(0, 10) ?? null;
    const fmtThreshold = `${Math.floor(t.threshold / 60)}:${String(t.threshold % 60).padStart(2, '0')}/km`;
    const fmtBest = bestPace < Infinity
      ? `${Math.floor(bestPace / 60)}:${String(Math.round(bestPace % 60)).padStart(2, '0')}/km`
      : '—';

    return {
      id: t.id,
      name: t.name,
      category: 'speed',
      description: `Alcanzar un ritmo promedio menor a ${fmtThreshold} en una salida de 3 km o más`,
      xp: t.xp,
      unlocked,
      unlockedAt: date,
      unlockedReason: date
        ? `Desbloqueado el ${formatDate(date)} al alcanzar un ritmo promedio mejor a ${fmtThreshold}.`
        : `Alcanzá ${fmtThreshold} de ritmo en alguna salida.`,
      progress: bestPace < Infinity ? Math.min((720 - bestPace) / (720 - t.threshold), 1) : 0,
      progressText: `Mejor ritmo: ${fmtBest} → objetivo: ${fmtThreshold}`,
    };
  });
}

// ── Exploration achievements ───────────────────────────────────────────────

function computeExplorationAchievements(allRuns: StravaActivity[]): Achievement[] {
  const sorted = sortedAsc(allRuns);
  const trailRuns = sorted.filter(a => (a.sport_type || a.type) === 'TrailRun');
  const totalElevation = allRuns.reduce((s, a) => s + a.total_elevation_gain, 0);

  // First trail run
  const firstTrail = trailRuns[0];
  const firstTrailAch: Achievement = {
    id: 'first_trail',
    name: 'Primera salida de trail',
    category: 'exploration',
    description: 'Completar una salida de trail running',
    xp: 150,
    unlocked: !!firstTrail,
    unlockedAt: firstTrail?.start_date_local.slice(0, 10) ?? null,
    unlockedReason: firstTrail
      ? `Desbloqueado el ${formatDate(firstTrail.start_date_local.slice(0, 10))} con tu primera salida de trail.`
      : 'Completá una salida de trail running.',
    progress: firstTrail ? 1 : 0,
    progressText: firstTrail ? '✓' : '0 / 1 salidas de trail',
  };

  // 5 trail runs
  const fiveTrail = trailRuns[4];
  const fiveTrailAch: Achievement = {
    id: 'five_trail',
    name: '5 salidas de trail',
    category: 'exploration',
    description: 'Completar 5 salidas de trail running',
    xp: 250,
    unlocked: trailRuns.length >= 5,
    unlockedAt: fiveTrail?.start_date_local.slice(0, 10) ?? null,
    unlockedReason: fiveTrail
      ? `Desbloqueado el ${formatDate(fiveTrail.start_date_local.slice(0, 10))} con tu quinta salida de trail.`
      : 'Completá 5 salidas de trail running.',
    progress: pct(trailRuns.length, 5),
    progressText: progressText(trailRuns.length, 5, 'salidas de trail'),
  };

  // First big elevation (200m+)
  const firstBigElev = sorted.find(a => a.total_elevation_gain >= 200);
  const bigElevAch: Achievement = {
    id: 'elev200',
    name: 'Primera ascensión',
    category: 'exploration',
    description: 'Completar una salida con 200 m de desnivel positivo',
    xp: 200,
    unlocked: !!firstBigElev,
    unlockedAt: firstBigElev?.start_date_local.slice(0, 10) ?? null,
    unlockedReason: firstBigElev
      ? `Desbloqueado el ${formatDate(firstBigElev.start_date_local.slice(0, 10))} con ${Math.round(firstBigElev.total_elevation_gain)} m de desnivel.`
      : 'Completá una salida con 200 m o más de desnivel positivo.',
    progress: Math.min(Math.max(...sorted.map(a => a.total_elevation_gain), 0) / 200, 1),
    progressText: `${Math.round(Math.max(...sorted.map(a => a.total_elevation_gain), 0))} / 200 m`,
  };

  // Total elevation 5000m
  const elev5kAch: Achievement = {
    id: 'elev5000',
    name: '5000 m de desnivel acumulado',
    category: 'exploration',
    description: 'Acumular 5000 m de desnivel positivo en todas las salidas',
    xp: 400,
    unlocked: totalElevation >= 5000,
    unlockedAt: null, // complex to compute exact date
    unlockedReason: totalElevation >= 5000
      ? `Superaste 5000 m de desnivel acumulado.`
      : 'Acumulá 5000 m de desnivel positivo en tus salidas.',
    progress: pct(totalElevation, 5000),
    progressText: progressText(Math.round(totalElevation), 5000, 'm de desnivel'),
  };

  return [firstTrailAch, fiveTrailAch, bigElevAch, elev5kAch];
}

// ── Main export ────────────────────────────────────────────────────────────

export function computeAchievements(
  activities: StravaActivity[],
  stats: ProcessedStats
): AchievementMap {
  const allRuns = runs(activities);

  return {
    distance: computeDistanceAchievements(allRuns),
    volume: computeVolumeAchievements(allRuns),
    consistency: computeConsistencyAchievements(allRuns, stats),
    speed: computeSpeedAchievements(allRuns),
    exploration: computeExplorationAchievements(allRuns),
  };
}

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  distance: 'Distancia',
  volume: 'Volumen',
  consistency: 'Consistencia',
  speed: 'Velocidad',
  exploration: 'Exploración',
};

// Returns achievements closest to being unlocked (top 3 per category max)
export function getUpcomingAchievements(achievementMap: AchievementMap): Achievement[] {
  const all: Achievement[] = Object.values(achievementMap).flat();
  return all
    .filter(a => !a.unlocked && a.progress > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6);
}
