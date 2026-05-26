'use client';

import React from 'react';
import { ProcessedStats } from '@/types/stats';
import { computePermissions, computeEtaWeeks, formatEta, formatProgressText } from '@/lib/gamification';
import { getRecentAvgKm } from '@/lib/momentum';
import {
  MissionCard,
  MissionMeta,
  MissionLeft,
  MissionLabel,
  MissionTitle,
  MissionPermission,
  PermissionBadge,
  BigProgressTrack,
  BigProgressFill,
  ProgressMeta,
  ProgressNarrative,
  EtaText,
} from './styled';

interface ActiveMissionProps {
  stats: ProcessedStats;
}

const ActiveMission: React.FC<ActiveMissionProps> = ({ stats }) => {
  const permissions = computePermissions(stats);
  const active = permissions
    .filter((p) => !p.allUnlocked && p.isRevealed)
    .sort((a, b) => b.progressToNext - a.progressToNext)[0];

  if (!active) return null;

  const avgKmPerWeek = getRecentAvgKm(stats.weekly, 4);
  const etaWeeks = computeEtaWeeks(active, avgKmPerWeek);
  const etaText = etaWeeks !== null && etaWeeks > 0 && etaWeeks < 13 ? formatEta(etaWeeks) : null;

  const tierLabel = active.unlockedTiers > 0
    ? `${active.category.categoryName} · Tier ${active.unlockedTiers + 1} de ${active.category.tiers.length}`
    : 'Misión activa';

  return (
    <MissionCard>
      <MissionMeta>
        <MissionLeft>
          <MissionLabel>{tierLabel}</MissionLabel>
          <MissionTitle>{active.nextTier?.name ?? active.category.categoryName}</MissionTitle>
          <MissionPermission>{active.category.unitLabel}</MissionPermission>
        </MissionLeft>
        <PermissionBadge>{active.category.permissionCode}</PermissionBadge>
      </MissionMeta>

      <BigProgressTrack>
        <BigProgressFill $pct={active.progressToNext} />
      </BigProgressTrack>

      <ProgressMeta>
        <ProgressNarrative>
          <strong>{formatProgressText(active)}</strong>
        </ProgressNarrative>
        {etaText && etaText.length > 0 && <EtaText>lo desbloqueás aprox. {etaText}</EtaText>}
      </ProgressMeta>
    </MissionCard>
  );
};

export default ActiveMission;
