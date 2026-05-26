import { ProcessedStats } from '@/types/stats';
import { PermissionProgress } from '@/types/gamification';
import { LevelInfo } from '@/lib/levels';
import { getRecentAvgKm } from '@/lib/momentum';
import { computeEtaWeeks, formatEta } from '@/lib/gamification';

export interface Prediction {
  id: string;
  label: string;
  value: string;
  detail: string;
  numericKm?: number;
}

export function computePredictions(
  stats: ProcessedStats,
  permissions: PermissionProgress[],
  levelInfo: LevelInfo
): Prediction[] {
  const avgKmPerWeek = getRecentAvgKm(stats.weekly, 4);
  if (avgKmPerWeek < 1) return [];

  const predictions: Prediction[] = [];

  // 1. Year-end km projection
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weeksElapsed = (now.getTime() - startOfYear.getTime()) / (7 * 86400000);
  const weeksRemaining = 52 - weeksElapsed;

  if (weeksRemaining > 0 && stats.currentYearDistance > 0) {
    const projected = Math.round(stats.currentYearDistance + avgKmPerWeek * weeksRemaining);
    if (projected > stats.currentYearDistance * 1.05) {
      predictions.push({
        id: 'year_end',
        label: 'A fin de año',
        value: `${projected} km`,
        detail: 'proyectado a este ritmo',
        numericKm: projected,
      });
    }
  }

  // 2. Next cumulative-km permission ETA
  const cumKmNext = permissions
    .filter((p) => !p.allUnlocked && p.isRevealed && p.nextTier)
    .filter((p) => ['pizza', 'vacaciones', 'millar'].includes(p.category.id))
    .sort((a, b) => b.progressToNext - a.progressToNext)[0];

  if (cumKmNext) {
    const weeks = computeEtaWeeks(cumKmNext, avgKmPerWeek);
    if (weeks !== null && weeks > 0 && weeks < 26) {
      const eta = formatEta(weeks);
      if (eta) {
        predictions.push({
          id: 'next_permission',
          label: cumKmNext.category.categoryName,
          value: cumKmNext.nextTier!.name,
          detail: eta,
        });
      }
    }
  }

  // 3. Next level ETA
  if (levelInfo.xpToNext !== null && levelInfo.xpToNext > 0) {
    const xpPerWeek =
      avgKmPerWeek * 10 +
      (stats.weekly.length > 0 ? stats.totalActivities / stats.weekly.length : 0) * 5;
    if (xpPerWeek > 0) {
      const weeks = levelInfo.xpToNext / xpPerWeek;
      if (weeks > 0 && weeks < 52) {
        const eta = formatEta(weeks);
        if (eta) {
          predictions.push({
            id: 'next_level',
            label: 'Próximo nivel',
            value: `Nivel ${levelInfo.level + 1}`,
            detail: eta,
          });
        }
      }
    }
  }

  // 4. First half marathon (if runs 10km+ but not 21km yet)
  if (stats.longestActivity >= 10 && stats.longestActivity < 21 && avgKmPerWeek >= 15) {
    const weeksUntilReady = Math.max(0, (25 - avgKmPerWeek) / (avgKmPerWeek * 0.08));
    if (weeksUntilReady < 20) {
      const eta = weeksUntilReady < 2 ? 'casi listo' : `en ~${Math.round(weeksUntilReady)} semanas`;
      predictions.push({
        id: 'half_marathon',
        label: 'Primera media',
        value: '21 km',
        detail: eta,
      });
    }
  }

  return predictions.slice(0, 3);
}
