import { DayStats } from '@/types/stats';
import { localDateKey } from './localDate';

function dateAddDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getCurrentStreak(daily: DayStats[]): number {
  if (daily.length === 0) return 0;
  const dateSet = new Set(daily.map((d) => d.date));
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let current = today;
  if (!dateSet.has(current)) {
    current = dateAddDays(current, -1);
  }
  while (dateSet.has(current)) {
    streak++;
    current = dateAddDays(current, -1);
  }
  return streak;
}

/**
 * Monday-anchored week index for a `YYYY-MM-DD` date, computed from date
 * components (timezone-safe). Consecutive weeks differ by exactly 1, across
 * month and year boundaries.
 */
function weekIndexFromDate(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const days = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  // 1970-01-01 was a Thursday; shift by 3 so Mondays start each week bucket.
  return Math.floor((days + 3) / 7);
}

/**
 * Consecutive active weeks ending at the most recent active week.
 * Current week counts only if it already has ≥1 activity — while it is still
 * running, an empty current week doesn't break the streak yet.
 *
 * Takes `daily` (not `weekly`) for the same reason as the longest streak:
 * the week index comes from date components, so it doesn't depend on the
 * key format of `groupByWeek` or on the process timezone.
 */
export function computeWeeklyStreak(daily: DayStats[], now: Date = new Date()): number {
  const activeWeeks = new Set(
    daily.filter(d => d.count > 0).map(d => weekIndexFromDate(d.date))
  );
  if (!activeWeeks.size) return 0;

  const todayWeek = weekIndexFromDate(localDateKey(now));
  let w = activeWeeks.has(todayWeek) ? todayWeek : todayWeek - 1;

  let streak = 0;
  while (activeWeeks.has(w)) {
    streak++;
    w--;
  }
  return streak;
}

/**
 * Longest run of consecutive active weeks across every week available
 * (last ~12 months). A week counts as active with ≥1 activity — going out
 * twice in a week still counts as a single active week for the streak.
 */
export function computeLongestWeeklyStreak(daily: DayStats[]): number {
  const weeks = new Set(
    daily.filter(d => d.count > 0).map(d => weekIndexFromDate(d.date))
  );
  if (!weeks.size) return 0;

  const sorted = [...weeks].sort((a, b) => a - b);
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}

export function getLongestStreak(daily: DayStats[]): number {
  if (daily.length === 0) return 0;
  const dates = daily.map((d) => d.date).sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const cur = new Date(dates[i]);
    const diff = (cur.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }
  return longest;
}
