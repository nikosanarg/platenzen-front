'use client';

import React from 'react';
import { ProcessedStats } from '@/types/stats';
import { PermissionProgress } from '@/types/gamification';
import { computePermissions, formatProgressText } from '@/lib/gamification';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  PanelRoot,
  SubSection,
  SubSectionTitle,
  CollectionCount,
  MedalleroGrid,
  MedalleroCard,
  MedalleroCode,
  MedalleroCategory,
  MedalleroTierName,
  TierDots,
  TierDot,
  MissionsStack,
  MissionItem,
  MissionHeader,
  MissionCodeBadge,
  MissionInfo,
  MissionCategory,
  MissionTierName,
  MissionProgressText,
  ProgressRow,
  ProgressTrack,
  ProgressFill,
  ProgressLabel,
  CercaBadge,
  SecretGrid,
  SecretCard,
  SecretBadge,
  SecretLabel,
  EmptyUnlocked,
} from './styled';

interface GamificationPanelProps {
  stats: ProcessedStats;
}

function totalUnlockedTiers(permissions: PermissionProgress[]): number {
  return permissions.reduce((s, p) => s + p.unlockedTiers, 0);
}

function totalTiers(permissions: PermissionProgress[]): number {
  return permissions.reduce((s, p) => s + p.category.tiers.length, 0);
}

const GamificationPanel: React.FC<GamificationPanelProps> = ({ stats }) => {
  const permissions = computePermissions(stats);

  const unlocked = permissions.filter((p) => p.unlockedTiers > 0 && !p.category.isSecret);
  const legendary = permissions.filter(
    (p) => p.category.isSecret && p.isRevealed
  );
  const secrets = permissions.filter(
    (p) => p.category.isSecret && !p.isRevealed
  );

  // Pending: not fully unlocked, not secret-unrevealed, skip top 1 (in ActiveMission)
  const allPending = permissions
    .filter((p) => !p.allUnlocked && p.isRevealed && !p.category.isSecret)
    .sort((a, b) => b.progressToNext - a.progressToNext);

  const cerca = allPending.filter((p) => p.progressToNext >= 0.7);
  const regular = allPending.filter((p) => p.progressToNext < 0.7).slice(0, 3);

  const unlockedCount = totalUnlockedTiers(permissions);
  const total = totalTiers(permissions);

  return (
    <PanelRoot>
      <SectionTitle>Permisos</SectionTitle>

      {/* Medallero */}
      <SubSection>
        <SubSectionTitle>Desbloqueados</SubSectionTitle>
        <CollectionCount>
          {unlockedCount} de {total} tiers desbloqueados
        </CollectionCount>

        {unlocked.length === 0 ? (
          <EmptyUnlocked>Completá tu primera misión para empezar el medallero.</EmptyUnlocked>
        ) : (
          <MedalleroGrid>
            {unlocked.map((p) => (
              <MedalleroCard key={p.category.id}>
                <MedalleroCode>{p.category.permissionCode}</MedalleroCode>
                <MedalleroCategory>{p.category.categoryName}</MedalleroCategory>
                <MedalleroTierName>{p.currentTierName}</MedalleroTierName>
                <TierDots>
                  {p.category.tiers.map((t) => (
                    <TierDot key={t.level} $filled={t.level <= p.unlockedTiers} />
                  ))}
                </TierDots>
              </MedalleroCard>
            ))}
          </MedalleroGrid>
        )}
      </SubSection>

      {/* Cerca de desbloquear (Task 15) */}
      {cerca.length > 0 && (
        <SubSection style={{ marginTop: '1.5rem' }}>
          <SubSectionTitle>Cerca de desbloquear</SubSectionTitle>
          <MissionsStack>
            {cerca.map((p) => (
              <MissionItem key={p.category.id} $cerca>
                <CercaBadge>{Math.round(p.progressToNext * 100)}%</CercaBadge>
                <MissionHeader>
                  <MissionCodeBadge>{p.category.permissionCode}</MissionCodeBadge>
                  <MissionInfo>
                    <MissionCategory>{p.category.categoryName}</MissionCategory>
                    <MissionTierName>{p.nextTier?.name}</MissionTierName>
                  </MissionInfo>
                </MissionHeader>
                <ProgressRow>
                  <ProgressTrack>
                    <ProgressFill $pct={p.progressToNext} />
                  </ProgressTrack>
                  <ProgressLabel>{formatProgressText(p)}</ProgressLabel>
                </ProgressRow>
              </MissionItem>
            ))}
          </MissionsStack>
        </SubSection>
      )}

      {/* Lo que estás por desbloquear (skip top 1 already in ActiveMission) */}
      {regular.length > 0 && (
        <SubSection style={{ marginTop: '1.5rem' }}>
          <SubSectionTitle>Lo que estás por desbloquear</SubSectionTitle>
          <MissionsStack>
            {regular.map((p) => (
              <MissionItem key={p.category.id}>
                <MissionHeader>
                  <MissionCodeBadge>{p.category.permissionCode}</MissionCodeBadge>
                  <MissionInfo>
                    <MissionCategory>
                      {p.category.categoryName}
                      {p.unlockedTiers > 0 && ` · Tier ${p.unlockedTiers + 1}`}
                    </MissionCategory>
                    <MissionTierName>{p.nextTier?.name}</MissionTierName>
                    <MissionProgressText>{p.category.unitLabel}</MissionProgressText>
                  </MissionInfo>
                </MissionHeader>
                <ProgressRow>
                  <ProgressTrack>
                    <ProgressFill $pct={p.progressToNext} />
                  </ProgressTrack>
                  <ProgressLabel>{formatProgressText(p)}</ProgressLabel>
                </ProgressRow>
              </MissionItem>
            ))}
          </MissionsStack>
        </SubSection>
      )}

      {/* Legendarios (revealed secrets) */}
      {legendary.length > 0 && (
        <SubSection style={{ marginTop: '1.5rem' }}>
          <SubSectionTitle>Legendarios</SubSectionTitle>
          <MissionsStack>
            {legendary.map((p) => (
              <MissionItem key={p.category.id} $cerca={p.unlockedTiers > 0}>
                {p.unlockedTiers > 0 && (
                  <TierDots style={{ marginBottom: '0.25rem' }}>
                    {p.category.tiers.map((t) => (
                      <TierDot key={t.level} $filled={t.level <= p.unlockedTiers} />
                    ))}
                  </TierDots>
                )}
                <MissionHeader>
                  <MissionCodeBadge>{p.category.permissionCode}</MissionCodeBadge>
                  <MissionInfo>
                    <MissionCategory>{p.category.categoryName}</MissionCategory>
                    <MissionTierName>
                      {p.currentTierName ?? p.nextTier?.name}
                    </MissionTierName>
                    <MissionProgressText>{p.category.unitLabel}</MissionProgressText>
                  </MissionInfo>
                </MissionHeader>
                {!p.allUnlocked && (
                  <ProgressRow>
                    <ProgressTrack>
                      <ProgressFill $pct={p.progressToNext} />
                    </ProgressTrack>
                    <ProgressLabel>{formatProgressText(p)}</ProgressLabel>
                  </ProgressRow>
                )}
              </MissionItem>
            ))}
          </MissionsStack>
        </SubSection>
      )}

      {/* Secretos (unrevealed) */}
      {secrets.length > 0 && (
        <SubSection style={{ marginTop: '1.5rem' }}>
          <SubSectionTitle>Secretos</SubSectionTitle>
          <SecretGrid>
            {secrets.map((p) => (
              <SecretCard key={p.category.id}>
                <SecretBadge>?</SecretBadge>
                <SecretLabel>Por descubrir</SecretLabel>
              </SecretCard>
            ))}
          </SecretGrid>
        </SubSection>
      )}
    </PanelRoot>
  );
};

export default GamificationPanel;
