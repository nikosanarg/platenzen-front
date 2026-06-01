import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export interface ConsistencyStats {
  consecutiveWeeks: number;
  monthsWithActivity: number;
  avgActivitiesPerWeek: number;
  favoriteDays: string[];
  mostFrequentHour: number | null;
  activeWeeksLast12: number;
  totalWeeksLast12: number;
}

export function computeConsistencyStats(
  activities: StravaActivity[],
  stats: ProcessedStats
): ConsistencyStats {
  let consecutiveWeeks = 0;
  const sortedWeeks = [...stats.weekly].sort((a, b) => b.week.localeCompare(a.week));
  for (const w of sortedWeeks) {
    if (w.count > 0) consecutiveWeeks++;
    else break;
  }

  const monthSet = new Set<string>();
  for (const act of activities) {
    monthSet.add(act.start_date_local.slice(0, 7));
  }

  const recent12 = stats.weekly.slice(-12);
  const avgActivitiesPerWeek =
    recent12.length > 0
      ? recent12.reduce((s, w) => s + w.count, 0) / recent12.length
      : 0;

  const sortedDays = [...stats.weekdayDistribution].sort((a, b) => b.count - a.count);
  const favoriteDays = sortedDays
    .filter(d => d.count > 0)
    .slice(0, 2)
    .map(d => WEEKDAY_LABELS[d.day]);

  const topHour = [...stats.hourlyDistribution].sort((a, b) => b.count - a.count)[0];
  const mostFrequentHour = topHour && topHour.count > 0 ? topHour.hour : null;

  return {
    consecutiveWeeks,
    monthsWithActivity: monthSet.size,
    avgActivitiesPerWeek: Math.round(avgActivitiesPerWeek * 10) / 10,
    favoriteDays,
    mostFrequentHour,
    activeWeeksLast12: recent12.filter(w => w.count > 0).length,
    totalWeeksLast12: recent12.length,
  };
}
