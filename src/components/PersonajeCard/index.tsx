'use client';

import React from 'react';
import { Activity } from '@/types/activity';
import { ProcessedStats } from '@/types/stats';
import { getLevelInfo } from '@/lib/xpSystem';
import { computeRoles, computeAdnScores, BRANCH_ROLES } from '@/lib/roles';
import { computeLongestWeeklyStreak } from '@/utils/streaks';
import { computeCoreRecord } from '@/lib/coreRecord';
import { formatRecordTime } from '@/lib/recordHistory';
import { buildPersonaDescription } from '@/lib/runnerPersona';
import { IconRoute, IconCalendar, IconFlame, IconHourglass } from '@/components/Icon';
import ActivityHeatmap from '@/components/charts/ActivityHeatmap';
import SpiderChart from './SpiderChart';
import {
  Card,
  TopRow,
  IdentityCol,
  VisualCol,
  AdnChartWrapper,
  RoleHeading,
  RoleNamePrimary,
  LevelBadge,
  XpHeadRow,
  XpBigValue,
  XpMeta,
  LevelBarRow,
  LevelTrack,
  LevelFill,
  LevelEndpoint,
  LevelEndpointDot,
  LevelEndpointLabel,
  XpToNext,
  PersonaText,
  StatsGrid,
  StatCard,
  StatIcon,
  StatBody,
  StatValue,
  StatLabel,
  VisualColTitle,
  RankBlock,
  RankCurrentRow,
  RankCurrentName,
  RankPct,
  RankNextName,
  RankProgressTrack,
  RankProgressFill,
  RankStepsRow,
  RankStep,
  RankStepArrow,
  RankMaxNote,
  ActivitySection,
  ActivityTitle,
  ActivitySubtitle,
} from './styled';

interface PersonajeCardProps {
  activities: Activity[];
  stats: ProcessedStats;
}

const PersonajeCard: React.FC<PersonajeCardProps> = ({ activities, stats }) => {
  const levelInfo = getLevelInfo(activities, stats);
  const roles = computeRoles(activities, stats);
  const adn = computeAdnScores(activities, stats);
  const longestStreak = computeLongestWeeklyStreak(stats.daily);
  const coreRecord = computeCoreRecord(activities);

  const sortedBranches = [...roles.branches].sort((a, b) => {
    const ld = b.currentRole.level - a.currentRole.level;
    return ld !== 0 ? ld : b.afinidad - a.afinidad;
  });
  const primary = sortedBranches[0];

  const persona = buildPersonaDescription(primary, stats, adn.consistencia);

  const nextLevelLabel = levelInfo.nextThreshold ? `Nivel ${levelInfo.level + 1}` : 'MÁX';

  const xpMeta = levelInfo.nextThreshold
    ? `/ ${levelInfo.nextThreshold.toLocaleString('es-AR')} XP`
    : 'XP';

  const xpToNextLabel = levelInfo.nextThreshold
    ? `Faltan ${levelInfo.xpToNext!.toLocaleString('es-AR')} XP para ${nextLevelLabel}`
    : 'Nivel máximo alcanzado';

  const rankSteps = BRANCH_ROLES[primary.branch];

  return (
    <Card>
      <TopRow>
        {/* ── Identidad + XP + estadísticas ── */}
        <IdentityCol>
          <RoleHeading>
            <RoleNamePrimary>{primary.currentRole.name}</RoleNamePrimary>
            <LevelBadge>(Nivel {levelInfo.level})</LevelBadge>
          </RoleHeading>

          <XpHeadRow>
            <XpBigValue>{levelInfo.xp.toLocaleString('es-AR')}</XpBigValue>
            <XpMeta>{xpMeta}</XpMeta>
          </XpHeadRow>

          <LevelBarRow>
            <LevelTrack>
              <LevelFill $pct={levelInfo.progress} />
            </LevelTrack>
            <LevelEndpoint>
              <LevelEndpointDot />
              <LevelEndpointLabel>{nextLevelLabel}</LevelEndpointLabel>
            </LevelEndpoint>
          </LevelBarRow>
          <XpToNext>{xpToNextLabel}</XpToNext>

          <PersonaText>{persona}</PersonaText>

          <StatsGrid>
            <StatCard>
              <StatIcon><IconRoute size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue>{Math.round(stats.totalDistance).toLocaleString('es-AR')} km</StatValue>
                <StatLabel>recorrido</StatLabel>
              </StatBody>
            </StatCard>

            <StatCard>
              <StatIcon><IconCalendar size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue>{stats.totalActivities.toLocaleString('es-AR')}</StatValue>
                <StatLabel>actividades</StatLabel>
              </StatBody>
            </StatCard>

            <StatCard>
              <StatIcon $emphasis><IconFlame size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue $emphasis>{longestStreak} {longestStreak === 1 ? 'semana' : 'semanas'}</StatValue>
                <StatLabel>Mejor racha</StatLabel>
              </StatBody>
            </StatCard>

            <StatCard>
              <StatIcon $emphasis><IconHourglass size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue $emphasis>{coreRecord ? formatRecordTime(coreRecord.timeSeconds) : '—'}</StatValue>
                <StatLabel>{coreRecord ? `Récord ${coreRecord.label}` : 'Récord'}</StatLabel>
              </StatBody>
            </StatCard>
          </StatsGrid>
        </IdentityCol>

        {/* ── Radar: perfil de corredor ── */}
        <VisualCol>
          <VisualColTitle>Perfil de corredor</VisualColTitle>
          <AdnChartWrapper>
            <SpiderChart scores={adn} />
          </AdnChartWrapper>
        </VisualCol>

        {/* ── Rango actual + próximo objetivo (rama dominante) ── */}
        <VisualCol>
          <VisualColTitle>Rango</VisualColTitle>
          <RankBlock>
            <RankCurrentRow>
              <RankCurrentName>{primary.currentRole.name}</RankCurrentName>
              {primary.nextRole && (
                <>
                  <RankPct>{primary.afinidad}%</RankPct>
                  <RankNextName>&rarr; {primary.nextRole.name}</RankNextName>
                </>
              )}
            </RankCurrentRow>

            {primary.nextRole ? (
              <RankProgressTrack>
                <RankProgressFill $pct={primary.afinidad} />
              </RankProgressTrack>
            ) : (
              <RankMaxNote>Rango máximo de esta rama</RankMaxNote>
            )}

            <RankStepsRow>
              {rankSteps.map((step, i) => {
                const state =
                  step.level < primary.currentRole.level
                    ? 'done'
                    : step.level === primary.currentRole.level
                    ? 'current'
                    : 'upcoming';
                return (
                  <React.Fragment key={step.id}>
                    {i > 0 && <RankStepArrow>&rarr;</RankStepArrow>}
                    <RankStep $state={state}>{step.name}</RankStep>
                  </React.Fragment>
                );
              })}
            </RankStepsRow>
          </RankBlock>
        </VisualCol>
      </TopRow>

      {/* ── Consistencia anual: el heatmap como evidencia, no decoración ── */}
      <ActivitySection>
        <ActivityTitle>Tu año en actividad</ActivityTitle>
        <ActivitySubtitle>
          {longestStreak} {longestStreak === 1 ? 'semana activa' : 'semanas activas'} · {stats.totalActivities.toLocaleString('es-AR')} actividades · {Math.round(stats.totalDistance).toLocaleString('es-AR')} km
        </ActivitySubtitle>
        <ActivityHeatmap data={stats.daily} />
      </ActivitySection>
    </Card>
  );
};

export default PersonajeCard;
