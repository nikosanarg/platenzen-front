import { StravaActivity } from '@/types/strava';
import {
  ProcessedStats,
  SportCount,
  HourCount,
  WeekdayCount,
  CumulativePoint,
  PacePoint,
} from '@/types/stats';
import { metersToKm } from '@/utils/units';
import { mpsToSecPerKm } from '@/utils/pace';
import { groupByMonth, groupByWeek, groupByDay } from '@/utils/grouping';
import { getCurrentStreak, getLongestStreak } from '@/utils/streaks';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);
const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Lun → Sáb → Dom

function computeSportDistribution(activities: StravaActivity[]): SportCount[] {
  const map = new Map<string, SportCount>();
  for (const act of activities) {
    const sport = act.sport_type || act.type;
    const existing = map.get(sport) ?? { sport, count: 0, distance: 0 };
    existing.count += 1;
    existing.distance += metersToKm(act.distance);
    map.set(sport, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function computeHourlyDistribution(activities: StravaActivity[]): HourCount[] {
  const counts: number[] = new Array<number>(24).fill(0);
  for (const act of activities) {
    // Parse hour directly from the local date string to avoid JS timezone conversion.
    // Strava's start_date_local carries a "Z" suffix but is actually local time.
    const h = parseInt(act.start_date_local.slice(11, 13), 10);
    counts[h]++;
  }
  return counts.map((count, hour) => ({
    hour,
    label: `${hour.toString().padStart(2, '0')}:00`,
    count,
  }));
}

function computeWeekdayDistribution(activities: StravaActivity[]): WeekdayCount[] {
  const counts: number[] = new Array<number>(7).fill(0);
  for (const act of activities) {
    // Construct date from the local date string components to avoid timezone shift.
    const [yr, mo, da] = act.start_date_local.slice(0, 10).split('-').map(Number);
    const day = new Date(yr, mo - 1, da).getDay();
    counts[day]++;
  }
  // Return Mon→Sat→Sun order (weekdays first, weekend last).
  return WEEKDAY_ORDER.map((day) => ({
    day,
    label: WEEKDAY_LABELS[day],
    count: counts[day],
  }));
}

function computeCumulativeDistance(activities: StravaActivity[]): CumulativePoint[] {
  const sorted = [...activities].sort((a, b) =>
    a.start_date_local.localeCompare(b.start_date_local)
  );
  let cumulative = 0;
  return sorted.map((act) => {
    cumulative += metersToKm(act.distance);
    return {
      date: act.start_date_local.slice(0, 10),
      cumulative: Math.round(cumulative * 10) / 10,
    };
  });
}

function computePaceEvolution(activities: StravaActivity[]): PacePoint[] {
  const running = activities
    .filter((a) => RUNNING_SPORTS.has(a.sport_type || a.type) && a.average_speed > 0 && a.distance > 1000)
    .sort((a, b) => a.start_date_local.localeCompare(b.start_date_local));
  return running.map((act) => ({
    date: act.start_date_local.slice(0, 10),
    pace: Math.round(mpsToSecPerKm(act.average_speed)),
    label: act.start_date_local.slice(0, 10),
  }));
}

function computeWeeklyAvg(activities: StravaActivity[]): number {
  if (activities.length === 0) return 0;
  const weekly = groupByWeek(activities);
  const totalKm = weekly.reduce((s, w) => s + w.distance, 0);
  return weekly.length > 0 ? totalKm / weekly.length : 0;
}

export function computeStats(activities: StravaActivity[]): ProcessedStats {
  const totalDistance = activities.reduce((s, a) => s + metersToKm(a.distance), 0);
  const totalTime = activities.reduce((s, a) => s + a.moving_time, 0);
  const totalActivities = activities.length;

  const runningActivities = activities.filter(
    (a) => RUNNING_SPORTS.has(a.sport_type || a.type) && a.average_speed > 0
  );
  const avgPace =
    runningActivities.length > 0
      ? runningActivities.reduce((s, a) => s + mpsToSecPerKm(a.average_speed), 0) /
        runningActivities.length
      : 0;
  const bestPace =
    runningActivities.length > 0
      ? Math.min(...runningActivities.map((a) => mpsToSecPerKm(a.average_speed)))
      : 0;
  const longestActivity = activities.length > 0
    ? Math.max(...activities.map((a) => metersToKm(a.distance)))
    : 0;

  const daily = groupByDay(activities);

  const currentYear = new Date().getFullYear().toString();
  const yearActs = activities.filter((a) => a.start_date_local.startsWith(currentYear));
  const currentYearDistance = Math.round(yearActs.reduce((s, a) => s + metersToKm(a.distance), 0) * 10) / 10;

  return {
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalTime,
    totalActivities,
    weeklyAvgDistance: Math.round(computeWeeklyAvg(activities) * 10) / 10,
    avgPace: Math.round(avgPace),
    bestPace: Math.round(bestPace),
    longestActivity: Math.round(longestActivity * 10) / 10,
    currentStreak: getCurrentStreak(daily),
    longestStreak: getLongestStreak(daily),
    currentYearDistance,
    currentYearActivities: yearActs.length,
    monthly: groupByMonth(activities),
    weekly: groupByWeek(activities),
    daily,
    paceEvolution: computePaceEvolution(activities),
    sportDistribution: computeSportDistribution(activities),
    hourlyDistribution: computeHourlyDistribution(activities),
    weekdayDistribution: computeWeekdayDistribution(activities),
    cumulativeDistance: computeCumulativeDistance(activities),
  };
}
