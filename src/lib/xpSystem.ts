import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeAchievements } from '@/lib/achievements';
import { HALF_MARATHON_KM, MARATHON_KM } from '@/lib/distances';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

// Fibonacci-based level thresholds, scaled by 200 XP per fib unit
// fib: 1,1,2,3,5,8,13,21,34,55,89,144,233,377,610
const FIB_STEPS = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610];
const XP_SCALE = 200;

export const LEVEL_THRESHOLDS: number[] = [0];
for (let i = 0; i < FIB_STEPS.length; i++) {
  LEVEL_THRESHOLDS.push(LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + FIB_STEPS[i] * XP_SCALE);
}

export const LEVEL_NAMES = [
  'Corredor iniciado',
  'Corredor en formación',
  'Corredor regular',
  'Corredor consistente',
  'Corredor experimentado',
  'Corredor sostenido',
  'Corredor maduro',
  'Corredor referente',
  'Corredor de fondo',
  'Corredor legendario',
  'Corredor élite',
  'Corredor maestro',
  'Corredor mítico',
  'Corredor definitivo',
  'Corredor inmortal',
];

const MILESTONE_DISTANCES_KM = [5, 10, 15, HALF_MARATHON_KM, 31.5, MARATHON_KM];

export interface XpEventItem {
  label: string;
  xp: number;
  type: 'level' | 'role';
}

export interface XPBreakdown {
  fromKm: number;
  fromMilestones: number;
  fromPRs: number;
  fromWeeklyRecords: number;
  fromCompleteWeeks: number;
  fromCompleteMonths: number;
  fromAchievements: number;
  totalKm12mo: number;
  milestonesReached: number;
  prCount: number;
  weeklyRecordCount: number;
  completeWeeks: number;
  completeMonths: number;
  unlockedAchievements: number;
  total: number;
  xpSourceSummary: string;
  xpEvents: XpEventItem[];
}

export interface LevelInfo {
  level: number;
  name: string;
  xp: number;
  currentThreshold: number;
  nextThreshold: number | null;
  progress: number;
  xpToNext: number | null;
  breakdown: XPBreakdown;
}

function get12MonthRuns(activities: StravaActivity[]): StravaActivity[] {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);
  const cutoffMs = cutoff.getTime();
  return activities.filter(a => {
    const d = new Date(a.start_date_local).getTime();
    return d >= cutoffMs && RUNNING_SPORTS.has(a.sport_type || a.type);
  });
}

function countMilestones(activities: StravaActivity[]): number {
  const reached = new Set<number>();
  for (const a of activities) {
    const km = a.distance / 1000;
    for (const m of MILESTONE_DISTANCES_KM) {
      if (km >= m) reached.add(m);
    }
  }
  return reached.size;
}

function countPRs(activities: StravaActivity[]): number {
  const sorted = [...activities].sort(
    (a, b) => new Date(a.start_date_local).getTime() - new Date(b.start_date_local).getTime()
  );
  let prCount = 0;
  let bestPace = Infinity;
  let bestDistance = 0;
  for (const a of sorted) {
    if (a.distance < 1000 || a.moving_time <= 0) continue;
    const km = a.distance / 1000;
    const pace = a.moving_time / km;
    if (km >= 3 && pace < bestPace) {
      bestPace = pace;
      prCount++;
    }
    if (km > bestDistance) {
      bestDistance = km;
      prCount++;
    }
  }
  return prCount;
}

interface WeekGroup {
  week: string;
  distance: number;
  count: number;
}

function groupByWeek(activities: StravaActivity[]): WeekGroup[] {
  const map = new Map<string, WeekGroup>();
  for (const a of activities) {
    const d = new Date(a.start_date_local);
    const diff = (d.getDay() + 6) % 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - diff);
    const key = mon.toISOString().slice(0, 10);
    const entry = map.get(key) ?? { week: key, distance: 0, count: 0 };
    entry.distance += a.distance / 1000;
    entry.count++;
    map.set(key, entry);
  }
  return Array.from(map.values()).sort((a, b) => a.week.localeCompare(b.week));
}

function countWeeklyRecords(weeks: WeekGroup[]): number {
  let records = 0;
  let best = 0;
  for (const w of weeks) {
    if (w.distance > best) { best = w.distance; records++; }
  }
  return records;
}

function countCompleteWeeks(weeks: WeekGroup[]): number {
  return weeks.filter(w => w.count >= 3).length;
}

function countCompleteMonths(weeks: WeekGroup[]): number {
  const byMonth = new Map<string, WeekGroup[]>();
  for (const w of weeks) {
    const mo = w.week.slice(0, 7);
    const arr = byMonth.get(mo) ?? [];
    arr.push(w);
    byMonth.set(mo, arr);
  }
  let complete = 0;
  for (const [, monthWeeks] of byMonth) {
    if (monthWeeks.length >= 4 && monthWeeks.every(w => w.count >= 3)) complete++;
  }
  return complete;
}

function buildXpEvents(
  partial: Omit<XPBreakdown, 'xpSourceSummary' | 'total' | 'xpEvents'>
): XpEventItem[] {
  return ([
    { label: `${Math.round(partial.totalKm12mo)} km recorridos (12 meses)`, xp: partial.fromKm, type: 'level' as const },
    { label: `${partial.unlockedAchievements} logros desbloqueados`, xp: partial.fromAchievements, type: 'role' as const },
    { label: `${partial.milestonesReached} hitos de distancia`, xp: partial.fromMilestones, type: 'level' as const },
    { label: `${partial.prCount} récords personales`, xp: partial.fromPRs, type: 'level' as const },
    { label: `${partial.weeklyRecordCount} semanas récord`, xp: partial.fromWeeklyRecords, type: 'level' as const },
    { label: `${partial.completeWeeks} semanas con 3+ salidas`, xp: partial.fromCompleteWeeks, type: 'level' as const },
    { label: `${partial.completeMonths} meses completamente activos`, xp: partial.fromCompleteMonths, type: 'level' as const },
  ] as XpEventItem[])
    .filter(e => e.xp > 0)
    .sort((a, e) => e.xp - a.xp)
    .slice(0, 5);
}

function b(n: number | string): string {
  return `<strong>${n}</strong>`;
}

function buildSummary(breakdown: Omit<XPBreakdown, 'xpSourceSummary' | 'total' | 'xpEvents'>): string {
  const sources = [
    { label: `${b(Math.round(breakdown.totalKm12mo))} km recorridos`, value: breakdown.fromKm },
    { label: `${b(breakdown.milestonesReached)} hitos de distancia`, value: breakdown.fromMilestones },
    { label: `${b(breakdown.prCount)} récords personales`, value: breakdown.fromPRs },
    { label: `${b(breakdown.weeklyRecordCount)} semanas récord`, value: breakdown.fromWeeklyRecords },
    { label: `${b(breakdown.completeWeeks)} semanas con 3+ salidas`, value: breakdown.fromCompleteWeeks },
    { label: `${b(breakdown.completeMonths)} meses completamente activos`, value: breakdown.fromCompleteMonths },
    { label: `${b(breakdown.unlockedAchievements)} logros desbloqueados`, value: breakdown.fromAchievements },
  ]
    .filter(s => s.value > 0)
    .sort((a, b2) => b2.value - a.value);

  if (sources.length === 0) return 'Empezá a correr para ganar XP.';
  if (sources.length === 1) return `Tu XP proviene de ${sources[0].label}.`;
  const top = sources[0];
  const second = sources[1];
  return `Tu mayor fuente de XP: ${top.label} (${b(top.value)} XP). También sumaron ${second.label} (${b(second.value)} XP).`;
}

export function computeXPBreakdown(activities: StravaActivity[], stats: ProcessedStats): XPBreakdown {
  const recent = get12MonthRuns(activities);
  const totalKm12mo = recent.reduce((s, a) => s + a.distance / 1000, 0);
  const fromKm = Math.round(totalKm12mo * 5);
  const milestonesReached = countMilestones(recent);
  const fromMilestones = milestonesReached * 10;
  const prCount = countPRs(recent);
  const fromPRs = prCount * 10;
  const weeks = groupByWeek(recent);
  const weeklyRecordCount = countWeeklyRecords(weeks);
  const fromWeeklyRecords = weeklyRecordCount * 20;
  const completeWeeks = countCompleteWeeks(weeks);
  const fromCompleteWeeks = completeWeeks * 30;
  const completeMonths = countCompleteMonths(weeks);
  const fromCompleteMonths = completeMonths * 50;

  // Sum XP from all unlocked achievements across all categories
  const achievementMap = computeAchievements(activities, stats);
  const allAchievements = Object.values(achievementMap).flat();
  const unlockedAchievements = allAchievements.filter(a => a.unlocked).length;
  const fromAchievements = allAchievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.xp, 0);

  const total = fromKm + fromMilestones + fromPRs + fromWeeklyRecords +
    fromCompleteWeeks + fromCompleteMonths + fromAchievements;

  const partial = {
    fromKm, fromMilestones, fromPRs, fromWeeklyRecords, fromCompleteWeeks, fromCompleteMonths,
    fromAchievements, totalKm12mo, milestonesReached, prCount, weeklyRecordCount, completeWeeks,
    completeMonths, unlockedAchievements,
  };

  return {
    ...partial,
    total,
    xpSourceSummary: buildSummary(partial),
    xpEvents: buildXpEvents(partial),
  };
}

export function getLevelInfo(activities: StravaActivity[], stats: ProcessedStats): LevelInfo {
  const breakdown = computeXPBreakdown(activities, stats);
  const xp = breakdown.total;

  let idx = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { idx = i; break; }
  }
  idx = Math.min(idx, LEVEL_NAMES.length - 1);

  const currentThreshold = LEVEL_THRESHOLDS[idx];
  const nextThreshold = idx < LEVEL_THRESHOLDS.length - 1 ? LEVEL_THRESHOLDS[idx + 1] : null;
  const rangeSize = nextThreshold ? nextThreshold - currentThreshold : 1;
  const progress = nextThreshold ? Math.min((xp - currentThreshold) / rangeSize, 1) : 1;

  return {
    level: idx + 1,
    name: LEVEL_NAMES[idx],
    xp,
    currentThreshold,
    nextThreshold,
    progress,
    xpToNext: nextThreshold ? nextThreshold - xp : null,
    breakdown,
  };
}
