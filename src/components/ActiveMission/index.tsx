'use client';

import React from 'react';
import { ProcessedStats } from '@/types/stats';
import { computeMissions } from '@/lib/gamification';
import {
  computeEtaWeeks,
  formatEta,
  formatCurrentValue,
  formatTargetValue,
} from '@/lib/gamification';
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
  const missions = computeMissions(stats);
  const active = missions
    .filter((m) => !m.completed)
    .sort((a, b) => b.progress - a.progress)[0];

  if (!active) return null;

  const avgKmPerWeek = getRecentAvgKm(stats.weekly, 4);
  const etaWeeks = computeEtaWeeks(active, avgKmPerWeek);
  const etaText = etaWeeks !== null && etaWeeks < 13 ? formatEta(etaWeeks) : null;

  return (
    <MissionCard>
      <MissionMeta>
        <MissionLeft>
          <MissionLabel>Misión activa</MissionLabel>
          <MissionTitle>{active.mission.title}</MissionTitle>
          <MissionPermission>{active.mission.description}</MissionPermission>
        </MissionLeft>
        <PermissionBadge>{active.mission.permissionCode}</PermissionBadge>
      </MissionMeta>

      <BigProgressTrack>
        <BigProgressFill $pct={active.progress} />
      </BigProgressTrack>

      <ProgressMeta>
        <ProgressNarrative>
          <strong>{formatCurrentValue(active)}</strong> de {formatTargetValue(active.mission)}
        </ProgressNarrative>
        {etaText && <EtaText>lo desbloqueás aprox. {etaText}</EtaText>}
      </ProgressMeta>

      <MissionPermission style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Recompensa: {active.mission.permission}
      </MissionPermission>
    </MissionCard>
  );
};

export default ActiveMission;
