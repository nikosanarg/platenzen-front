import { StravaActivity } from '@/types/strava';
import { MonthlyStats, WeeklyStats, DayStats } from '@/types/stats';
import { metersToKm } from './units';

const MONTH_LABELS: string[] = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

export function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  const year = d.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const weekNum = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
  return `${year}-W${weekNum.toString().padStart(2, '0')}`;
}

export function groupByMonth(activities: StravaActivity[]): MonthlyStats[] {
  const map = new Map<string, MonthlyStats>();
  for (const act of activities) {
    const d = new Date(act.start_date_local);
    const key = getMonthKey(d);
    const label = `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
    const existing = map.get(key) ?? { month: key, label, distance: 0, count: 0, time: 0 };
    existing.distance += metersToKm(act.distance);
    existing.count += 1;
    existing.time += act.moving_time;
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function groupByWeek(activities: StravaActivity[]): WeeklyStats[] {
  const map = new Map<string, WeeklyStats>();
  for (const act of activities) {
    const d = new Date(act.start_date_local);
    const key = getWeekKey(d);
    const existing = map.get(key) ?? { week: key, label: key, distance: 0, count: 0 };
    existing.distance += metersToKm(act.distance);
    existing.count += 1;
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.week.localeCompare(b.week));
}

export function groupByDay(activities: StravaActivity[]): DayStats[] {
  const map = new Map<string, DayStats>();
  for (const act of activities) {
    const d = new Date(act.start_date_local);
    const key = d.toISOString().slice(0, 10);
    const existing = map.get(key) ?? { date: key, count: 0, distance: 0 };
    existing.count += 1;
    existing.distance += metersToKm(act.distance);
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
