import { StravaActivity } from '@/types/strava';

export type PeriodType = '30d' | '90d' | 'year';

export interface PeriodData {
  distanceKm: number;
  activities: number;
  avgPaceSec: number;
  totalTimeSec: number;
  avgTimePerActivitySec: number;
}

export interface PeriodComparison {
  period: PeriodType;
  label: string;
  current: PeriodData;
  previous: PeriodData;
}

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

function filterByDateRange(
  activities: StravaActivity[],
  fromMs: number,
  toMs: number
): StravaActivity[] {
  return activities.filter(a => {
    const t = new Date(a.start_date_local.slice(0, 10)).getTime();
    return t >= fromMs && t < toMs;
  });
}

function computePeriodData(acts: StravaActivity[]): PeriodData {
  if (acts.length === 0) return { distanceKm: 0, activities: 0, avgPaceSec: 0, totalTimeSec: 0, avgTimePerActivitySec: 0 };

  const distanceKm = acts.reduce((s, a) => s + a.distance / 1000, 0);
  const totalTimeSec = acts.reduce((s, a) => s + a.moving_time, 0);

  const runs = acts.filter(a => RUNNING_SPORTS.has(a.sport_type || a.type) && a.average_speed > 0);
  const avgPaceSec =
    runs.length > 0
      ? runs.reduce((s, a) => s + 1000 / a.average_speed, 0) / runs.length
      : 0;

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    activities: acts.length,
    avgPaceSec: Math.round(avgPaceSec),
    totalTimeSec,
    avgTimePerActivitySec: acts.length > 0 ? Math.round(totalTimeSec / acts.length) : 0,
  };
}

export function computePeriodComparisons(activities: StravaActivity[]): PeriodComparison[] {
  const now = Date.now();
  const DAY = 86400000;

  const t30 = computePeriodData(filterByDateRange(activities, now - 30 * DAY, now));
  const t30prev = computePeriodData(filterByDateRange(activities, now - 60 * DAY, now - 30 * DAY));

  const t90 = computePeriodData(filterByDateRange(activities, now - 90 * DAY, now));
  const t90prev = computePeriodData(filterByDateRange(activities, now - 180 * DAY, now - 90 * DAY));

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;
  const yearStart = new Date(currentYear, 0, 1).getTime();
  const prevYearStart = new Date(prevYear, 0, 1).getTime();
  const prevYearEnd = new Date(prevYear, 11, 31).getTime() + DAY;
  const tYear = computePeriodData(filterByDateRange(activities, yearStart, now));
  const tYearPrev = computePeriodData(filterByDateRange(activities, prevYearStart, prevYearEnd));

  return [
    { period: '30d', label: 'Últimos 30 días', current: t30, previous: t30prev },
    { period: '90d', label: 'Últimos 90 días', current: t90, previous: t90prev },
    { period: 'year', label: `Año ${currentYear}`, current: tYear, previous: tYearPrev },
  ];
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function formatPaceSec(sec: number): string {
  if (sec === 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}/km`;
}

export function formatTimeSec(sec: number): string {
  if (sec === 0) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
