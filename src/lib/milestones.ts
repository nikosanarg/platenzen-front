import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';

export interface Milestone {
  id: string;
  label: string;
  description: string;
  xpReward: number;
  unlocked: boolean;
  unlockedDate?: string;
  progress: number;
  progressLabel?: string;
}

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

function shortDate(date: string): string {
  const [yr, mo, da] = date.split('-');
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${parseInt(da)} ${MONTHS[parseInt(mo) - 1]} ${yr}`;
}

export function computeMilestones(
  activities: StravaActivity[],
  stats: ProcessedStats
): Milestone[] {
  const runs = activities.filter(a => RUNNING_SPORTS.has(a.sport_type || a.type));
  const sorted = [...activities].sort((a, b) => a.start_date_local.localeCompare(b.start_date_local));

  function firstDateWithDistance(minKm: number): string | undefined {
    return runs
      .filter(a => a.distance >= minKm * 1000)
      .sort((a, b) => a.start_date_local.localeCompare(b.start_date_local))[0]
      ?.start_date_local.slice(0, 10);
  }

  function firstCumulativeDate(targetKm: number): string | undefined {
    let cum = 0;
    for (const act of sorted) {
      cum += act.distance / 1000;
      if (cum >= targetKm) return act.start_date_local.slice(0, 10);
    }
    return undefined;
  }

  const nthActivityDate = (n: number) => sorted[n - 1]?.start_date_local.slice(0, 10);

  const has5k = runs.some(a => a.distance >= 5000);
  const has10k = runs.some(a => a.distance >= 10000);
  const has15k = runs.some(a => a.distance >= 15000);
  const has21k = runs.some(a => a.distance >= 21000);

  return [
    {
      id: 'first_5k',
      label: 'Primer 5K',
      description: 'Una salida de al menos 5 km',
      xpReward: 100,
      unlocked: has5k,
      unlockedDate: has5k ? shortDate(firstDateWithDistance(5)!) : undefined,
      progress: Math.min(1, stats.longestActivity / 5),
      progressLabel: !has5k ? `${Math.round(stats.longestActivity * 10) / 10} de 5 km` : undefined,
    },
    {
      id: 'first_10k',
      label: 'Primer 10K',
      description: 'Una salida de al menos 10 km',
      xpReward: 200,
      unlocked: has10k,
      unlockedDate: has10k ? shortDate(firstDateWithDistance(10)!) : undefined,
      progress: Math.min(1, stats.longestActivity / 10),
      progressLabel: !has10k ? `${Math.round(stats.longestActivity * 10) / 10} de 10 km` : undefined,
    },
    {
      id: 'first_15k',
      label: 'Primer 15K',
      description: 'Una salida de al menos 15 km',
      xpReward: 300,
      unlocked: has15k,
      unlockedDate: has15k ? shortDate(firstDateWithDistance(15)!) : undefined,
      progress: Math.min(1, stats.longestActivity / 15),
      progressLabel: !has15k ? `${Math.round(stats.longestActivity * 10) / 10} de 15 km` : undefined,
    },
    {
      id: 'first_21k',
      label: 'Primera media maratón',
      description: 'Una salida de al menos 21 km',
      xpReward: 500,
      unlocked: has21k,
      unlockedDate: has21k ? shortDate(firstDateWithDistance(21)!) : undefined,
      progress: Math.min(1, stats.longestActivity / 21),
      progressLabel: !has21k ? `${Math.round(stats.longestActivity * 10) / 10} de 21 km` : undefined,
    },
    {
      id: 'km_100',
      label: '100 km acumulados',
      description: 'Un total de 100 km recorridos',
      xpReward: 150,
      unlocked: stats.totalDistance >= 100,
      unlockedDate: stats.totalDistance >= 100 ? shortDate(firstCumulativeDate(100)!) : undefined,
      progress: Math.min(1, stats.totalDistance / 100),
      progressLabel: stats.totalDistance < 100 ? `${Math.round(stats.totalDistance)} de 100 km` : undefined,
    },
    {
      id: 'km_500',
      label: '500 km acumulados',
      description: 'Un total de 500 km recorridos',
      xpReward: 400,
      unlocked: stats.totalDistance >= 500,
      unlockedDate: stats.totalDistance >= 500 ? shortDate(firstCumulativeDate(500)!) : undefined,
      progress: Math.min(1, stats.totalDistance / 500),
      progressLabel: stats.totalDistance < 500 ? `${Math.round(stats.totalDistance)} de 500 km` : undefined,
    },
    {
      id: 'acts_50',
      label: '50 actividades',
      description: '50 salidas registradas',
      xpReward: 100,
      unlocked: stats.totalActivities >= 50,
      unlockedDate: stats.totalActivities >= 50 ? shortDate(nthActivityDate(50)!) : undefined,
      progress: Math.min(1, stats.totalActivities / 50),
      progressLabel: stats.totalActivities < 50 ? `${stats.totalActivities} de 50` : undefined,
    },
    {
      id: 'acts_100',
      label: '100 actividades',
      description: '100 salidas registradas',
      xpReward: 200,
      unlocked: stats.totalActivities >= 100,
      unlockedDate: stats.totalActivities >= 100 ? shortDate(nthActivityDate(100)!) : undefined,
      progress: Math.min(1, stats.totalActivities / 100),
      progressLabel: stats.totalActivities < 100 ? `${stats.totalActivities} de 100` : undefined,
    },
  ];
}

export function getMilestoneXpBonus(milestones: Milestone[]): number {
  return milestones.filter(m => m.unlocked).reduce((s, m) => s + m.xpReward, 0);
}
