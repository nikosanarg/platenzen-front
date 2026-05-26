import { WeeklyStats } from '@/types/stats';

export type MomentumState = 'subiendo' | 'sostenido' | 'bajando';

export interface MomentumInfo {
  state: MomentumState;
  pctChange: number;
  recentAvgKm: number;
  prevAvgKm: number;
}

export function computeMomentum(weekly: WeeklyStats[]): MomentumInfo | null {
  if (weekly.length < 5) return null;

  const recent = weekly.slice(-4);
  const prev = weekly.slice(-8, -4);
  if (prev.length === 0) return null;

  const recentAvgKm = recent.reduce((s, w) => s + w.distance, 0) / recent.length;
  const prevAvgKm = prev.reduce((s, w) => s + w.distance, 0) / prev.length;
  if (prevAvgKm < 0.5) return null;

  const pctChange = ((recentAvgKm - prevAvgKm) / prevAvgKm) * 100;
  const state: MomentumState = pctChange > 15 ? 'subiendo' : pctChange < -15 ? 'bajando' : 'sostenido';

  return { state, pctChange, recentAvgKm, prevAvgKm };
}

export function getRecentAvgKm(weekly: WeeklyStats[], weeksBack = 4): number {
  if (weekly.length === 0) return 0;
  const slice = weekly.slice(-weeksBack);
  return slice.reduce((s, w) => s + w.distance, 0) / slice.length;
}

export function momentumLabel(info: MomentumInfo): string {
  const pct = Math.abs(Math.round(info.pctChange));
  if (info.state === 'subiendo') return `ritmo más alto que el mes pasado (+${pct}%)`;
  if (info.state === 'bajando') return `ritmo más bajo que el mes pasado (${pct}%)`;
  return 'ritmo estable';
}
