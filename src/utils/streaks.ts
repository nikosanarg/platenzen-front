import { DayStats } from '@/types/stats';

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
