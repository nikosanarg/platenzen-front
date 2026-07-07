'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { getLevelInfo } from '@/lib/xpSystem';
import { computeRoles, computeAdnScores } from '@/lib/roles';
import { computeLongestWeeklyStreak } from '@/utils/streaks';
import { computeCoreRecord } from '@/lib/coreRecord';
import { formatRecordTime } from '@/lib/recordHistory';
import { buildPersonaDescription } from '@/lib/runnerPersona';
import { IconRoute, IconCalendar, IconFlame, IconHourglass } from '@/components/Icon';
import ActivityHeatmap from '@/components/charts/ActivityHeatmap';
import SpiderChart from './SpiderChart';
import RoleTree from './RoleTree';
import {
  Card,
  TopRow,
  IdentityCol,
  VisualCol,
  AdnChartWrapper,
  RoleHeading,
  RoleNamePrimary,
  LevelBadge,
  LevelBarRow,
  LevelTrack,
  LevelFill,
  LevelEndpoint,
  LevelEndpointDot,
  LevelEndpointLabel,
  XpLabel,
  PersonaText,
  StatsGrid,
  StatCard,
  StatIcon,
  StatBody,
  StatValue,
  StatLabel,
  ActivitySection,
  ActivityTitle,
} from './styled';

interface PersonajeCardProps {
  activities: StravaActivity[];
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

  const xpLabel = levelInfo.nextThreshold
    ? `${levelInfo.xp.toLocaleString('es-AR')} / ${levelInfo.nextThreshold.toLocaleString('es-AR')} XP`
    : `${levelInfo.xp.toLocaleString('es-AR')} XP`;

  const nextLevelLabel = levelInfo.nextThreshold ? `Nivel ${levelInfo.level + 1}` : 'MÁX';

  return (
    <Card>
      <TopRow>
        {/* ── Identity ── */}
        <IdentityCol>
          <RoleHeading>
            <RoleNamePrimary>{primary.currentRole.name}</RoleNamePrimary>
            <LevelBadge>(Nivel {levelInfo.level})</LevelBadge>
          </RoleHeading>

          <LevelBarRow>
            <LevelTrack>
              <LevelFill $pct={levelInfo.progress} />
            </LevelTrack>
            <LevelEndpoint>
              <LevelEndpointDot />
              <LevelEndpointLabel>{nextLevelLabel}</LevelEndpointLabel>
            </LevelEndpoint>
          </LevelBarRow>
          <XpLabel>{xpLabel}</XpLabel>

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
              <StatIcon><IconFlame size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue>{longestStreak} {longestStreak === 1 ? 'semana' : 'semanas'}</StatValue>
                <StatLabel>Mejor racha</StatLabel>
              </StatBody>
            </StatCard>

            <StatCard>
              <StatIcon><IconHourglass size={18} color="currentColor" /></StatIcon>
              <StatBody>
                <StatValue>{coreRecord ? formatRecordTime(coreRecord.timeSeconds) : '—'}</StatValue>
                <StatLabel>{coreRecord ? `Récord ${coreRecord.label}` : 'Récord'}</StatLabel>
              </StatBody>
            </StatCard>
          </StatsGrid>
        </IdentityCol>

        {/* ── Spider chart ── */}
        <VisualCol>
          <AdnChartWrapper>
            <SpiderChart scores={adn} />
          </AdnChartWrapper>
        </VisualCol>

        {/* ── Role tree ── */}
        <VisualCol>
          <RoleTree branches={roles.branches} activities={activities} stats={stats} />
        </VisualCol>
      </TopRow>

      {/* ── Activity heatmap (full width) ── */}
      <ActivitySection>
        <ActivityTitle>Tu año en actividad</ActivityTitle>
        <ActivityHeatmap data={stats.daily} />
      </ActivitySection>
    </Card>
  );
};

export default PersonajeCard;
