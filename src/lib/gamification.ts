import { ProcessedStats } from '@/types/stats';
import { PermissionCategory, PermissionProgress, PermissionTier } from '@/types/gamification';

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'medialunas',
    categoryName: 'Medialunas',
    permissionCode: 'ML',
    unitLabel: 'actividades totales',
    higherIsBetter: true,
    tiers: [
      { level: 1, name: 'Medialunas en el bar', targetValue: 1 },
      { level: 2, name: 'Media docena', targetValue: 15 },
      { level: 3, name: 'Docena', targetValue: 35 },
      { level: 4, name: 'Factura completa', targetValue: 75 },
    ],
  },
  {
    id: 'cerveza',
    categoryName: 'Cerveza',
    permissionCode: 'CF',
    unitLabel: 'km en una sola salida',
    higherIsBetter: true,
    tiers: [
      { level: 1, name: 'Cerveza fría', targetValue: 5 },
      { level: 2, name: 'Pinta', targetValue: 10 },
      { level: 3, name: 'Porrón', targetValue: 21 },
      { level: 4, name: 'Chopp doble', targetValue: 42 },
    ],
  },
  {
    id: 'empanadas',
    categoryName: 'Empanadas',
    permissionCode: 'EM',
    unitLabel: 'salidas en una semana',
    higherIsBetter: true,
    tiers: [
      { level: 1, name: 'Empanadas', targetValue: 3 },
      { level: 2, name: 'Media docena de empanadas', targetValue: 4 },
      { level: 3, name: 'Cena de empanadas', targetValue: 5 },
    ],
  },
  {
    id: 'helado',
    categoryName: 'Helado',
    permissionCode: 'HD',
    unitLabel: 'ritmo mínimo alcanzado',
    higherIsBetter: false,
    tiers: [
      { level: 1, name: 'Helado doble', targetValue: 330 },
      { level: 2, name: 'Cuarto kilo', targetValue: 300 },
      { level: 3, name: 'Medio kilo', targetValue: 270 },
      { level: 4, name: 'Kilo', targetValue: 240 },
    ],
  },
  {
    id: 'pizza',
    categoryName: 'Pizza',
    permissionCode: 'PC',
    unitLabel: 'km acumulados',
    higherIsBetter: true,
    tiers: [
      { level: 1, name: 'Pizza al molde', targetValue: 50 },
      { level: 2, name: 'Especial de la casa', targetValue: 150 },
      { level: 3, name: 'Pizza con amigos', targetValue: 400 },
    ],
  },
  {
    id: 'vino',
    categoryName: 'Vino',
    permissionCode: 'BV',
    unitLabel: 'días de racha',
    higherIsBetter: true,
    tiers: [
      { level: 1, name: 'Botella de vino', targetValue: 5 },
      { level: 2, name: 'Vino joven', targetValue: 7 },
      { level: 3, name: 'Reserva', targetValue: 14 },
      { level: 4, name: 'Gran reserva', targetValue: 30 },
    ],
  },
  {
    id: 'cena',
    categoryName: 'Cena',
    permissionCode: 'CR',
    unitLabel: 'horas de carrera',
    higherIsBetter: true,
    tiers: [
      { level: 1, name: 'Cena simple', targetValue: 36000 },
      { level: 2, name: 'Cena con vino', targetValue: 108000 },
      { level: 3, name: 'Cena de celebración', targetValue: 360000 },
    ],
  },
  {
    id: 'asado',
    categoryName: 'Asado',
    permissionCode: 'AS',
    unitLabel: 'km en una semana',
    higherIsBetter: true,
    tiers: [
      { level: 1, name: 'Asado completo', targetValue: 20 },
      { level: 2, name: 'Asado de fin de semana', targetValue: 35 },
      { level: 3, name: 'Asado largo', targetValue: 50 },
      { level: 4, name: 'Parrillada para varios', targetValue: 70 },
    ],
  },
  {
    id: 'vacaciones',
    categoryName: 'Vacaciones',
    permissionCode: 'VP',
    unitLabel: 'km acumulados',
    higherIsBetter: true,
    tiers: [
      { level: 1, name: 'Vacaciones pagas', targetValue: 200 },
      { level: 2, name: 'Fin de semana de viaje', targetValue: 500 },
      { level: 3, name: 'Semana de viaje', targetValue: 1000 },
      { level: 4, name: 'Quincena', targetValue: 2000 },
    ],
  },
  {
    id: 'racha_legendaria',
    categoryName: 'Racha legendaria',
    permissionCode: 'RL',
    unitLabel: 'días de racha',
    higherIsBetter: true,
    isSecret: true,
    revealThreshold: 15,
    tiers: [
      { level: 1, name: 'Corredor incansable', targetValue: 30 },
      { level: 2, name: 'Leyenda local', targetValue: 60 },
      { level: 3, name: 'Leyenda regional', targetValue: 90 },
    ],
  },
  {
    id: 'millar',
    categoryName: 'El millar',
    permissionCode: 'MK',
    unitLabel: 'km acumulados',
    higherIsBetter: true,
    isSecret: true,
    revealThreshold: 400,
    tiers: [
      { level: 1, name: 'El primer millar', targetValue: 1000 },
      { level: 2, name: 'Doble millar', targetValue: 2000 },
      { level: 3, name: 'Los cinco años', targetValue: 5000 },
    ],
  },
];

function getCategoryValue(id: string, stats: ProcessedStats): number {
  switch (id) {
    case 'medialunas':
      return stats.totalActivities;
    case 'cerveza':
      return stats.longestActivity;
    case 'empanadas':
      return stats.weekly.length > 0 ? Math.max(...stats.weekly.map((w) => w.count)) : 0;
    case 'helado':
      return stats.bestPace > 0 ? stats.bestPace : Infinity;
    case 'pizza':
      return stats.totalDistance;
    case 'vino':
    case 'racha_legendaria':
      return stats.longestStreak;
    case 'cena':
      return stats.totalTime;
    case 'asado':
      return stats.weekly.length > 0 ? Math.max(...stats.weekly.map((w) => w.distance)) : 0;
    case 'vacaciones':
    case 'millar':
      return stats.totalDistance;
    default:
      return 0;
  }
}

function computeProgress(
  category: PermissionCategory,
  currentValue: number,
  unlockedTiers: number,
  nextTier: PermissionTier
): number {
  if (category.higherIsBetter) {
    const prevThreshold = unlockedTiers > 0 ? category.tiers[unlockedTiers - 1].targetValue : 0;
    const range = nextTier.targetValue - prevThreshold;
    return range > 0 ? Math.min(Math.max((currentValue - prevThreshold) / range, 0), 1) : 0;
  } else {
    if (currentValue === 0 || currentValue === Infinity) return 0;
    const prevThreshold =
      unlockedTiers > 0 ? category.tiers[unlockedTiers - 1].targetValue : nextTier.targetValue * 1.5;
    const range = prevThreshold - nextTier.targetValue;
    return range > 0 ? Math.min(Math.max((prevThreshold - currentValue) / range, 0), 1) : 0;
  }
}

export function computePermissions(stats: ProcessedStats): PermissionProgress[] {
  return PERMISSION_CATEGORIES.map((category) => {
    const currentValue = getCategoryValue(category.id, stats);

    let unlockedTiers = 0;
    for (const tier of category.tiers) {
      const met = category.higherIsBetter
        ? currentValue >= tier.targetValue
        : currentValue > 0 && currentValue !== Infinity && currentValue <= tier.targetValue;
      if (met) unlockedTiers++;
      else break;
    }

    const allUnlocked = unlockedTiers === category.tiers.length;
    const nextTier = allUnlocked ? null : category.tiers[unlockedTiers];
    const currentTierName = unlockedTiers > 0 ? category.tiers[unlockedTiers - 1].name : null;
    const progressToNext = nextTier ? computeProgress(category, currentValue, unlockedTiers, nextTier) : 1;

    const isRevealed =
      !category.isSecret ||
      unlockedTiers > 0 ||
      (category.revealThreshold !== undefined && currentValue >= category.revealThreshold);

    return {
      category,
      currentValue,
      unlockedTiers,
      currentTierName,
      nextTier,
      progressToNext,
      allUnlocked,
      isRevealed,
    };
  });
}

function formatPace(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}/km`;
}

export function formatProgressText(progress: PermissionProgress): string {
  const { category, currentValue, nextTier } = progress;
  if (!nextTier) return 'completado';

  switch (category.id) {
    case 'medialunas':
      return `${Math.min(Math.round(currentValue), nextTier.targetValue)} de ${nextTier.targetValue} actividades`;
    case 'cerveza':
      return `${currentValue.toFixed(1)} de ${nextTier.targetValue} km`;
    case 'empanadas':
      return `${currentValue} de ${nextTier.targetValue} salidas/semana`;
    case 'helado':
      return currentValue === Infinity || currentValue === 0
        ? `objetivo: ${formatPace(nextTier.targetValue)}`
        : `${formatPace(currentValue)} → ${formatPace(nextTier.targetValue)}`;
    case 'vino':
    case 'racha_legendaria':
      return `${currentValue} de ${nextTier.targetValue} días`;
    case 'cena': {
      const h = Math.floor(currentValue / 3600);
      const th = Math.floor(nextTier.targetValue / 3600);
      return `${h}h de ${th}h`;
    }
    case 'asado':
      return `${currentValue.toFixed(1)} de ${nextTier.targetValue} km/semana`;
    case 'pizza':
    case 'vacaciones':
    case 'millar':
      return `${currentValue.toFixed(1)} de ${nextTier.targetValue} km`;
    default:
      return `${Math.round(currentValue)} / ${nextTier.targetValue}`;
  }
}

// Returns ETA in weeks for cumulative-km categories only
export function computeEtaWeeks(progress: PermissionProgress, avgKmPerWeek: number): number | null {
  if (progress.allUnlocked || !progress.nextTier || avgKmPerWeek <= 0) return null;
  const cumIds = ['pizza', 'vacaciones', 'millar'];
  if (!cumIds.includes(progress.category.id)) return null;
  const remaining = progress.nextTier.targetValue - progress.currentValue;
  return remaining > 0 ? remaining / avgKmPerWeek : null;
}

export function formatEta(weeks: number): string {
  if (weeks < 1) return 'en menos de una semana';
  if (weeks < 2) return 'en alrededor de una semana';
  if (weeks < 5) return `en ~${Math.round(weeks)} semanas`;
  const months = weeks / 4.33;
  if (months < 2) return 'en alrededor de un mes';
  if (months < 12) return `en ~${Math.round(months)} meses`;
  return '';
}

export function getNextMilestoneText(permissions: PermissionProgress[], avgKmPerWeek: number): string | null {
  const candidates = permissions
    .filter((p) => !p.allUnlocked && p.isRevealed && p.nextTier)
    .sort((a, b) => b.progressToNext - a.progressToNext);

  if (candidates.length === 0) return null;
  const top = candidates[0];
  const { category, currentValue, nextTier } = top;
  if (!nextTier) return null;

  switch (category.id) {
    case 'pizza':
    case 'vacaciones':
    case 'millar': {
      const rem = nextTier.targetValue - currentValue;
      return `te faltan ${rem.toFixed(1)} km para ${nextTier.name}`;
    }
    case 'cerveza': {
      const rem = nextTier.targetValue - currentValue;
      return `corrés ${rem.toFixed(1)} km más en una salida y desbloqueás ${nextTier.name}`;
    }
    case 'vino':
    case 'racha_legendaria': {
      const rem = nextTier.targetValue - currentValue;
      return `${rem} día${rem > 1 ? 's' : ''} más de racha para desbloquear ${nextTier.name}`;
    }
    case 'helado':
      return `alcanzá ${formatPace(nextTier.targetValue)} para desbloquear ${nextTier.name}`;
    case 'medialunas': {
      const rem = nextTier.targetValue - Math.round(currentValue);
      return `${rem} actividad${rem > 1 ? 'es' : ''} más para desbloquear ${nextTier.name}`;
    }
    default:
      return `seguís avanzando hacia ${nextTier.name}`;
  }

  void avgKmPerWeek;
}
