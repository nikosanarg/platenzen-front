import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';

export type FormState = 'ascenso' | 'estable' | 'descenso';

export interface WeekChartPoint {
  label: string;
  km: number;
  isRecord: boolean;
  hasSharpIncrease: boolean;
}

export interface FormShapeData {
  state: FormState;
  volumeChangePct: number;
  consistencyChangePct: number;
  paceChangeSec: number;
  recentWeeklyAvgKm: number;
  recentActivePct: number;
  weeklyChart: WeekChartPoint[];
}

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

function weekLabel(isoWeek: string): string {
  // "2025-W04" → derive short label from week number
  const [yearStr, wPart] = isoWeek.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(wPart, 10);
  // Approximate Monday of that week
  const jan1 = new Date(year, 0, 1);
  const daysOffset = (week - 1) * 7 - jan1.getDay() + 1;
  const monday = new Date(year, 0, 1 + daysOffset);
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${monday.getDate()} ${MONTHS[monday.getMonth()]}`;
}

export function computeFormShape(
  activities: StravaActivity[],
  stats: ProcessedStats
): FormShapeData | null {
  if (stats.weekly.length < 5) return null;

  const recent4 = stats.weekly.slice(-4);
  const prev4 = stats.weekly.slice(-8, -4);
  if (prev4.length === 0) return null;

  const recentAvg = recent4.reduce((s, w) => s + w.distance, 0) / recent4.length;
  const prevAvg = prev4.reduce((s, w) => s + w.distance, 0) / prev4.length;
  if (prevAvg < 0.5) return null;

  const volumeChangePct = ((recentAvg - prevAvg) / prevAvg) * 100;

  const recentActiveWeeks = recent4.filter(w => w.count > 0).length;
  const prevActiveWeeks = prev4.filter(w => w.count > 0).length;
  const recentConsistency = recentActiveWeeks / 4;
  const prevConsistency = prevActiveWeeks / prev4.length;
  const consistencyChangePct = prevConsistency > 0
    ? ((recentConsistency - prevConsistency) / prevConsistency) * 100
    : 0;

  const recentRuns = activities
    .filter(a => RUNNING_SPORTS.has(a.sport_type || a.type) && a.average_speed > 0 && a.distance >= 3000)
    .sort((a, b) => b.start_date_local.localeCompare(a.start_date_local));

  let paceChangeSec = 0;
  if (recentRuns.length >= 10) {
    const last5pace = recentRuns.slice(0, 5).reduce((s, a) => s + 1000 / a.average_speed, 0) / 5;
    const prev5pace = recentRuns.slice(5, 10).reduce((s, a) => s + 1000 / a.average_speed, 0) / 5;
    paceChangeSec = Math.round(prev5pace - last5pace); // positive = faster
  }

  let state: FormState;
  if (volumeChangePct > 10 || (volumeChangePct > 0 && consistencyChangePct > 5)) {
    state = 'ascenso';
  } else if (volumeChangePct < -10 || (volumeChangePct < 0 && consistencyChangePct < -5)) {
    state = 'descenso';
  } else {
    state = 'estable';
  }

  const last26 = stats.weekly.slice(-26); // ~6 months
  const maxKm = Math.max(...last26.map(w => w.distance), 0);
  const weeklyChart: WeekChartPoint[] = last26.map((w, i) => {
    const prevKm = i > 0 ? last26[i - 1].distance : null;
    const hasSharpIncrease = prevKm !== null && prevKm > 0.5 && w.distance / prevKm > 1.3;
    return {
      label: weekLabel(w.week),
      km: Math.round(w.distance * 10) / 10,
      isRecord: maxKm > 0 && w.distance === maxKm,
      hasSharpIncrease,
    };
  });

  return {
    state,
    volumeChangePct: Math.round(volumeChangePct),
    consistencyChangePct: Math.round(consistencyChangePct),
    paceChangeSec,
    recentWeeklyAvgKm: Math.round(recentAvg * 10) / 10,
    recentActivePct: recentConsistency,
    weeklyChart,
  };
}
