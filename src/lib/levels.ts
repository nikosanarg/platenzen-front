import { ProcessedStats } from '@/types/stats';

const LEVEL_THRESHOLDS = [0, 500, 1500, 3500, 7000, 12000, 20000, 32000, 50000, 75000];
const LEVEL_NAMES = [
  'Corredor iniciado',
  'Corredor en construcción',
  'Corredor regular',
  'Corredor consistente',
  'Corredor experimentado',
  'Corredor sostenido',
  'Corredor maduro',
  'Corredor referente',
  'Corredor de fondo',
  'Corredor legendario',
];

export interface LevelInfo {
  level: number;
  name: string;
  xp: number;
  currentThreshold: number;
  nextThreshold: number | null;
  progress: number; // 0–1 within current level
  xpToNext: number | null;
}

export function computeXP(stats: ProcessedStats, unlockedCount: number): number {
  return Math.round(
    stats.totalDistance * 10 +
    stats.totalActivities * 5 +
    unlockedCount * 50
  );
}

export function getLevelInfo(xp: number): LevelInfo {
  let idx = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      idx = i;
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[idx];
  const nextThreshold = idx < LEVEL_THRESHOLDS.length - 1 ? LEVEL_THRESHOLDS[idx + 1] : null;
  const rangeSize = nextThreshold ? nextThreshold - currentThreshold : 1;
  const progress = nextThreshold ? Math.min((xp - currentThreshold) / rangeSize, 1) : 1;

  return {
    level: idx + 1,
    name: LEVEL_NAMES[idx],
    xp,
    currentThreshold,
    nextThreshold,
    progress,
    xpToNext: nextThreshold ? nextThreshold - xp : null,
  };
}
