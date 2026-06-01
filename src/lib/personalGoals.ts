import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { getRecentAvgKm } from '@/lib/momentum';

export interface PersonalGoal {
  id: string;
  label: string;
  progress: number;
  progressLabel: string;
}

function formatPace(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}/km`;
}

export function computePersonalGoals(
  activities: StravaActivity[],
  stats: ProcessedStats
): PersonalGoal[] {
  const goals: PersonalGoal[] = [];

  // Pace improvement goal
  if (stats.paceEvolution.length >= 5) {
    const recentSlice = stats.paceEvolution.slice(-5);
    const recentPace = recentSlice.reduce((s, p) => s + p.pace, 0) / recentSlice.length;
    const milestones = [7 * 60, 6 * 60 + 30, 6 * 60, 5 * 60 + 30, 5 * 60, 4 * 60 + 30, 4 * 60];
    const target = milestones.find(t => Math.round(recentPace) > t);
    if (target) {
      const windowSec = 60;
      const progress = Math.min(1, Math.max(0, 1 - (recentPace - target) / windowSec));
      goals.push({
        id: 'pace',
        label: `Bajar de ${formatPace(target)}`,
        progress,
        progressLabel: `Ritmo actual: ${formatPace(Math.round(recentPace))}`,
      });
    }
  }

  // Consecutive active weeks goal
  if (stats.weekly.length >= 4) {
    const recent4 = stats.weekly.slice(-4);
    const active4 = recent4.filter(w => w.count > 0).length;
    if (active4 < 4) {
      goals.push({
        id: 'consistency_4',
        label: 'Mantener 4 semanas activas seguidas',
        progress: active4 / 4,
        progressLabel: `${active4} de 4 semanas`,
      });
    } else {
      const recent8 = stats.weekly.slice(-8).filter(w => w.count > 0).length;
      if (recent8 < 8) {
        goals.push({
          id: 'consistency_8',
          label: 'Mantener 8 semanas activas seguidas',
          progress: recent8 / 8,
          progressLabel: `${recent8} de 8 semanas`,
        });
      }
    }
  }

  // Monthly distance goal
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const monthKm = stats.daily
    .filter(d => d.date.startsWith(monthPrefix))
    .reduce((s, d) => s + d.distance, 0);

  const recentAvgKm = getRecentAvgKm(stats.weekly, 4);
  if (recentAvgKm > 0) {
    const base = recentAvgKm * 4;
    const targets = [20, 30, 40, 50, 60, 80, 100, 120, 150, 200];
    const monthTarget = targets.find(t => t > monthKm && t >= base * 0.7) || Math.ceil(base / 10) * 10;
    if (monthTarget > 0 && monthKm < monthTarget) {
      goals.push({
        id: 'monthly',
        label: `Alcanzar ${monthTarget} km este mes`,
        progress: Math.min(1, monthKm / monthTarget),
        progressLabel: `${Math.round(monthKm * 10) / 10} de ${monthTarget} km`,
      });
    }
  }

  // Longest run PR goal
  if (stats.longestActivity > 0) {
    const nextDistances = [5, 10, 15, 21.1, 30, 42.2];
    const nextTarget = nextDistances.find(d => d > stats.longestActivity + 0.5);
    if (nextTarget && recentAvgKm >= nextTarget * 0.25) {
      const label = nextTarget >= 21 ? '21 km' : nextTarget >= 30 ? '30 km' : `${nextTarget} km`;
      goals.push({
        id: 'longest',
        label: `Completar ${label}`,
        progress: Math.min(1, stats.longestActivity / nextTarget),
        progressLabel: `Máxima actual: ${Math.round(stats.longestActivity * 10) / 10} km`,
      });
    }
  }

  return goals
    .filter(g => g.progress < 1)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);
}
