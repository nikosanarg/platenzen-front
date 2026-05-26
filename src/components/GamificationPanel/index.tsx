'use client';

import React from 'react';
import { ProcessedStats } from '@/types/stats';
import { computeMissions, formatCurrentValue, formatTargetValue } from '@/lib/gamification';
import { IconCheck } from '@/components/Icon';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  PanelRoot,
  SubSection,
  SubSectionTitle,
  MedalleroGrid,
  MedalleroCard,
  MedalleroCode,
  MedalleroPermission,
  MedalleroMission,
  MedalleroCheck,
  MissionsStack,
  MissionItem,
  MissionHeader,
  MissionCodeBadge,
  MissionInfo,
  MissionTitle,
  MissionDescription,
  MissionReward,
  ProgressRow,
  ProgressTrack,
  ProgressFill,
  ProgressLabel,
  EmptyUnlocked,
  CollectionCount,
} from './styled';

interface GamificationPanelProps {
  stats: ProcessedStats;
}

const GamificationPanel: React.FC<GamificationPanelProps> = ({ stats }) => {
  const missions = computeMissions(stats);
  const unlocked = missions.filter((m) => m.completed);
  // Skip the top mission — it's shown in ActiveMission already
  const pending = missions
    .filter((m) => !m.completed)
    .sort((a, b) => b.progress - a.progress)
    .slice(1, 4);

  return (
    <PanelRoot>
      <SectionTitle>Permisos</SectionTitle>

      <SubSection>
        <SubSectionTitle>
          Desbloqueados
        </SubSectionTitle>
        <CollectionCount>
          {unlocked.length} de {missions.length} permisos desbloqueados
        </CollectionCount>

        {unlocked.length === 0 ? (
          <EmptyUnlocked>Completá tu primera misión para ganar un permiso.</EmptyUnlocked>
        ) : (
          <MedalleroGrid>
            {unlocked.map(({ mission }) => (
              <MedalleroCard key={mission.id}>
                <MedalleroCheck>
                  <IconCheck size={12} color="var(--accent)" />
                </MedalleroCheck>
                <MedalleroCode>{mission.permissionCode}</MedalleroCode>
                <MedalleroPermission>{mission.permission}</MedalleroPermission>
                <MedalleroMission>{mission.title}</MedalleroMission>
              </MedalleroCard>
            ))}
          </MedalleroGrid>
        )}
      </SubSection>

      {pending.length > 0 && (
        <SubSection style={{ marginTop: '1.75rem' }}>
          <SubSectionTitle>Lo que estás por desbloquear</SubSectionTitle>
          <MissionsStack>
            {pending.map((mp, i) => (
              <MissionItem key={mp.mission.id} $featured={i === 0}>
                <MissionHeader>
                  <MissionCodeBadge>{mp.mission.permissionCode}</MissionCodeBadge>
                  <MissionInfo>
                    <MissionTitle $featured={i === 0}>{mp.mission.title}</MissionTitle>
                    <MissionDescription>{mp.mission.description}</MissionDescription>
                  </MissionInfo>
                </MissionHeader>
                <ProgressRow>
                  <ProgressTrack>
                    <ProgressFill $pct={mp.progress} />
                  </ProgressTrack>
                  <ProgressLabel>
                    {formatCurrentValue(mp)} / {formatTargetValue(mp.mission)}
                  </ProgressLabel>
                </ProgressRow>
                <MissionReward>{mp.mission.permission}</MissionReward>
              </MissionItem>
            ))}
          </MissionsStack>
        </SubSection>
      )}
    </PanelRoot>
  );
};

export default GamificationPanel;
