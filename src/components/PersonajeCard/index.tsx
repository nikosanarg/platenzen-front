'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { getLevelInfo } from '@/lib/xpSystem';
import { computeRoles, computeAdnScores } from '@/lib/roles';
import { computeWeeklyStreak } from '@/utils/streaks';
import ActivityHeatmap from '@/components/charts/ActivityHeatmap';
import SpiderChart from './SpiderChart';
import RoleTree from './RoleTree';
import {
  Card,
  LevelSection,
  RoleHeading,
  RoleNamePrimary,
  LevelBadge,
  StreakBadge,
  XpRow,
  XpTrack,
  XpFill,
  XpLabel,
  XpEventsList,
  XpEventRow,
  XpEventAmt,
  XpEventLabel,
  ActivitySection,
  ActivityTitle,
  AfinRow,
  AfinTrack,
  AfinFill,
  AfinLabel,
  VisualsRow,
  AdnSection,
  AdnChartWrapper,
  TreeSection,
} from './styled';

const BRANCH_LABELS: Record<string, string> = {
  distance: 'Distancia',
  speed: 'Velocidad',
  exploration: 'Exploración',
  achievement: 'Logros',
};

interface PersonajeCardProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const PersonajeCard: React.FC<PersonajeCardProps> = ({ activities, stats }) => {
  const levelInfo = getLevelInfo(activities, stats);
  const roles = computeRoles(activities, stats);
  const adn = computeAdnScores(activities, stats);
  const weeklyStreak = computeWeeklyStreak(stats.weekly);

  const sortedBranches = [...roles.branches].sort((a, b) => {
    const ld = b.currentRole.level - a.currentRole.level;
    return ld !== 0 ? ld : b.afinidad - a.afinidad;
  });

  const primary = sortedBranches[0];

  const xpLabel = levelInfo.nextThreshold
    ? `${levelInfo.xp.toLocaleString('es-AR')} / ${levelInfo.nextThreshold.toLocaleString('es-AR')} XP`
    : `${levelInfo.xp.toLocaleString('es-AR')} XP`;

  return (
    <Card>
      {/* ── Identity header ── */}
      <LevelSection>
        <RoleHeading>
          <RoleNamePrimary>{primary.currentRole.name}</RoleNamePrimary>
          <LevelBadge>(Nivel {levelInfo.level})</LevelBadge>
          {weeklyStreak >= 2 && (
            <StreakBadge>🔥 {weeklyStreak} sem</StreakBadge>
          )}
        </RoleHeading>

        <XpRow>
          <XpTrack>
            <XpFill $pct={levelInfo.progress} />
          </XpTrack>
          <XpLabel>{xpLabel}</XpLabel>
        </XpRow>

        <AfinRow>
          <AfinTrack>
            <AfinFill $pct={primary.afinidad} />
          </AfinTrack>
          <AfinLabel>
            {primary.currentRole.name} · {BRANCH_LABELS[primary.branch]} · {primary.afinidad}%
          </AfinLabel>
        </AfinRow>

        {/* Last 5 XP event sources */}
        <XpEventsList>
          {levelInfo.breakdown.xpEvents.map((ev, i) => (
            <XpEventRow key={i}>
              <XpEventAmt $type={ev.type}>+{ev.xp.toLocaleString('es-AR')} XP</XpEventAmt>
              <XpEventLabel>{ev.label}</XpEventLabel>
            </XpEventRow>
          ))}
        </XpEventsList>

        <ActivitySection>
          <ActivityTitle>Tu año en actividad</ActivityTitle>
          <ActivityHeatmap data={stats.daily} />
        </ActivitySection>
      </LevelSection>

      {/* ── Spider chart + Role tree (side by side on desktop) ── */}
      <VisualsRow>
        <AdnSection>
          <AdnChartWrapper>
            <SpiderChart scores={adn} />
          </AdnChartWrapper>
        </AdnSection>

        <TreeSection>
          <RoleTree branches={roles.branches} activities={activities} stats={stats} />
        </TreeSection>
      </VisualsRow>
    </Card>
  );
};

export default PersonajeCard;
