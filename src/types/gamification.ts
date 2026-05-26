export interface PermissionTier {
  level: number;
  name: string;
  targetValue: number;
}

export interface PermissionCategory {
  id: string;
  categoryName: string;
  permissionCode: string;
  unitLabel: string;
  higherIsBetter: boolean;
  tiers: PermissionTier[];
  isSecret?: boolean;
  revealThreshold?: number; // category metric value above which to show secret
}

export interface PermissionProgress {
  category: PermissionCategory;
  currentValue: number;
  unlockedTiers: number; // 0 = none
  currentTierName: string | null;
  nextTier: PermissionTier | null;
  progressToNext: number; // 0–1
  allUnlocked: boolean;
  isRevealed: boolean; // always true for non-secret; conditional for secrets
}
