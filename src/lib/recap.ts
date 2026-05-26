import { StravaActivity } from '@/types/strava';
import { MonthlyRecap, AnnualRecap } from '@/types/recap';

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

export function computeMonthlyRecap(
  activities: StravaActivity[],
  month: string
): MonthlyRecap | null {
  const filtered = activities.filter(
    (a) => a.start_date_local.startsWith(month) && RUNNING_SPORTS.has(a.sport_type)
  );
  if (filtered.length === 0) return null;

  const totalDistance = filtered.reduce((s, a) => s + a.distance / 1000, 0);
  const totalTime = filtered.reduce((s, a) => s + a.moving_time, 0);
  const totalActivities = filtered.length;

  const paces = filtered
    .filter((a) => a.average_speed > 0 && a.distance > 1000)
    .map((a) => 1000 / a.average_speed);
  const avgPace = paces.length > 0 ? paces.reduce((s, p) => s + p, 0) / paces.length : 0;
  const bestPace = paces.length > 0 ? Math.min(...paces) : 0;

  const longestRun = filtered.reduce((max, a) => Math.max(max, a.distance / 1000), 0);

  const activeDays = new Set(filtered.map((a) => a.start_date_local.slice(0, 10))).size;

  return {
    month,
    totalDistance,
    totalActivities,
    totalTime,
    avgPace,
    bestPace,
    longestRun,
    activeDays,
    permissionsUnlockedThisMonth: [],
  };
}

export function computeAnnualRecap(
  activities: StravaActivity[],
  year: number
): AnnualRecap | null {
  const yearStr = String(year);
  const filtered = activities.filter(
    (a) => a.start_date_local.startsWith(yearStr) && RUNNING_SPORTS.has(a.sport_type)
  );
  if (filtered.length === 0) return null;

  const totalDistance = filtered.reduce((s, a) => s + a.distance / 1000, 0);
  const totalTime = filtered.reduce((s, a) => s + a.moving_time, 0);
  const totalActivities = filtered.length;

  const months: MonthlyRecap[] = [];
  for (let m = 1; m <= 12; m++) {
    const monthStr = `${yearStr}-${String(m).padStart(2, '0')}`;
    const recap = computeMonthlyRecap(activities, monthStr);
    if (recap) months.push(recap);
  }

  const bestMonth = months.reduce(
    (best, m) => (m.totalDistance > (best?.totalDistance ?? 0) ? m : best),
    months[0]
  )?.month ?? '';

  const weeksInYear = 52;
  const avgWeeklyDistance = totalDistance / weeksInYear;

  return {
    year,
    totalDistance,
    totalActivities,
    totalTime,
    avgWeeklyDistance,
    bestMonth,
    months,
    permissionsUnlockedThisYear: [],
  };
}
