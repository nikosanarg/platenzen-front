import { ProcessedStats } from '@/types/stats';
import { Mission, MissionProgress } from '@/types/gamification';
import { getRecentAvgKm } from '@/lib/momentum';

const MISSIONS: Mission[] = [
  {
    id: 'first_run',
    title: 'Primera corrida',
    description: 'Completá cualquier actividad registrada',
    permission: 'Medialunas en el bar',
    permissionCode: 'ML',
    targetValue: 1,
    unit: 'actividad',
    higherIsBetter: true,
  },
  {
    id: 'run_5k',
    title: '5K completado',
    description: 'Corré 5km en una sola salida',
    permission: 'Cerveza fría',
    permissionCode: 'CF',
    targetValue: 5,
    unit: 'km',
    higherIsBetter: true,
  },
  {
    id: 'run_3_week',
    title: 'Semana activa',
    description: 'Corré 3 veces en una misma semana',
    permission: 'Empanadas',
    permissionCode: 'EM',
    targetValue: 3,
    unit: 'salidas',
    higherIsBetter: true,
  },
  {
    id: 'sub_5_pace',
    title: 'Velocista',
    description: 'Alcanzá un ritmo de 5:00/km o menos',
    permission: 'Helado doble',
    permissionCode: 'HD',
    targetValue: 300,
    unit: 'seg/km',
    higherIsBetter: false,
  },
  {
    id: 'run_10k',
    title: '10K completado',
    description: 'Corré 10km en una sola salida',
    permission: 'Pizza completa',
    permissionCode: 'PC',
    targetValue: 10,
    unit: 'km',
    higherIsBetter: true,
  },
  {
    id: 'streak_7',
    title: 'Racha de fuego',
    description: 'Corré 7 días seguidos',
    permission: 'Botella de vino',
    permissionCode: 'BV',
    targetValue: 7,
    unit: 'días',
    higherIsBetter: true,
  },
  {
    id: 'total_100km',
    title: 'Centenar',
    description: 'Acumulá 100km corridos en total',
    permission: 'Cena en restaurant',
    permissionCode: 'CR',
    targetValue: 100,
    unit: 'km',
    higherIsBetter: true,
  },
  {
    id: 'run_21k',
    title: 'Medio maratonista',
    description: 'Corré 21km en una sola salida',
    permission: 'Asado completo',
    permissionCode: 'AC',
    targetValue: 21.097,
    unit: 'km',
    higherIsBetter: true,
  },
  {
    id: 'total_500km',
    title: 'Medio millar',
    description: 'Acumulá 500km corridos en total',
    permission: 'Fin de semana de viaje',
    permissionCode: 'FV',
    targetValue: 500,
    unit: 'km',
    higherIsBetter: true,
  },
  {
    id: 'run_42k',
    title: 'Maratonista',
    description: 'Corré una maratón completa (42km)',
    permission: 'Vacaciones pagas',
    permissionCode: 'VP',
    targetValue: 42.195,
    unit: 'km',
    higherIsBetter: true,
  },
];

function getCurrentValue(missionId: string, stats: ProcessedStats): number {
  switch (missionId) {
    case 'first_run':
      return Math.min(stats.totalActivities, 1);
    case 'run_5k':
    case 'run_10k':
    case 'run_21k':
    case 'run_42k':
      return stats.longestActivity;
    case 'sub_5_pace':
      return stats.bestPace > 0 ? stats.bestPace : Infinity;
    case 'run_3_week':
      return stats.weekly.length > 0 ? Math.max(...stats.weekly.map((w) => w.count)) : 0;
    case 'streak_7':
      return stats.longestStreak;
    case 'total_100km':
    case 'total_500km':
      return stats.totalDistance;
    default:
      return 0;
  }
}

export function computeMissions(stats: ProcessedStats): MissionProgress[] {
  return MISSIONS.map((mission) => {
    const current = getCurrentValue(mission.id, stats);
    const completed = mission.higherIsBetter
      ? current >= mission.targetValue
      : current <= mission.targetValue && current > 0 && current !== Infinity;

    let progress: number;
    if (completed) {
      progress = 1;
    } else if (mission.higherIsBetter) {
      progress = Math.min(current / mission.targetValue, 1);
    } else {
      progress = current > 0 && current !== Infinity ? Math.min(mission.targetValue / current, 1) : 0;
    }

    return { mission, currentValue: current, completed, progress };
  });
}

export function formatCurrentValue(mp: MissionProgress): string {
  const { mission, currentValue } = mp;
  if (mission.id === 'sub_5_pace') {
    if (currentValue === Infinity || currentValue === 0) return '—';
    const mins = Math.floor(currentValue / 60);
    const secs = Math.round(currentValue % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/km`;
  }
  if (mission.unit === 'km') return `${currentValue.toFixed(1)} km`;
  if (mission.unit === 'días') return `${currentValue} días`;
  if (mission.unit === 'salidas') return `${currentValue} salidas`;
  return `${currentValue}`;
}

export function formatTargetValue(mission: Mission): string {
  if (mission.id === 'sub_5_pace') {
    const mins = Math.floor(mission.targetValue / 60);
    const secs = Math.round(mission.targetValue % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/km`;
  }
  if (mission.unit === 'km') {
    return `${mission.targetValue % 1 === 0 ? mission.targetValue : Math.round(mission.targetValue)} km`;
  }
  if (mission.unit === 'días') return `${mission.targetValue} días`;
  if (mission.unit === 'salidas') return `${mission.targetValue} salidas`;
  return `${mission.targetValue}`;
}

// Returns estimated weeks to completion for cumulative distance missions
export function computeEtaWeeks(mp: MissionProgress, avgKmPerWeek: number): number | null {
  if (mp.completed || avgKmPerWeek <= 0) return null;
  const { mission, currentValue } = mp;
  if (!['total_100km', 'total_500km'].includes(mission.id)) return null;
  const remaining = mission.targetValue - currentValue;
  if (remaining <= 0) return null;
  return remaining / avgKmPerWeek;
}

export function formatEta(weeks: number): string {
  if (weeks < 1) return 'en menos de una semana';
  if (weeks < 2) return 'en alrededor de una semana';
  if (weeks < 5) return `en alrededor de ${Math.round(weeks)} semanas`;
  const months = weeks / 4.33;
  if (months < 2) return 'en alrededor de un mes';
  if (months < 12) return `en alrededor de ${Math.round(months)} meses`;
  return null as unknown as string; // too far out, don't show
}

// Returns the next milestone text for the hero section
export function getNextMilestoneText(missions: MissionProgress[], avgKmPerWeek: number): string | null {
  const pending = missions
    .filter((m) => !m.completed)
    .sort((a, b) => b.progress - a.progress);

  if (pending.length === 0) return null;
  const next = pending[0];
  const { mission, currentValue } = next;

  if (['total_100km', 'total_500km'].includes(mission.id)) {
    const rem = mission.targetValue - currentValue;
    return `te faltan ${rem.toFixed(1)} km para ${mission.permission}`;
  }
  if (['run_5k', 'run_10k', 'run_21k', 'run_42k'].includes(mission.id)) {
    const rem = mission.targetValue - currentValue;
    return `con ${rem.toFixed(1)} km más en tu próxima salida desbloqueás ${mission.permission}`;
  }
  if (mission.id === 'streak_7') {
    const rem = mission.targetValue - currentValue;
    return `${rem} día${rem > 1 ? 's' : ''} más de racha para desbloquear ${mission.permission}`;
  }
  if (mission.id === 'sub_5_pace') {
    return `alcanzá 5:00/km para desbloquear ${mission.permission}`;
  }
  if (mission.id === 'run_3_week') {
    const rem = mission.targetValue - currentValue;
    return `${rem} salida${rem > 1 ? 's' : ''} más esta semana para desbloquear ${mission.permission}`;
  }
  return null;

  void avgKmPerWeek; // used by caller for ETA when needed
}
