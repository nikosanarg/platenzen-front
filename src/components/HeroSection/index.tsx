'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeXP, getLevelInfo } from '@/lib/levels';
import { computeMomentum, momentumLabel } from '@/lib/momentum';
import { computePermissions, getNextMilestoneText } from '@/lib/gamification';
import { computeRunnerProfile } from '@/lib/runnerProfile';
import { IconTrendUp, IconTrendFlat, IconTrendDown } from '@/components/Icon';
import {
  HeroCard,
  LevelRow,
  LevelLabel,
  LevelName,
  XpRow,
  XpTrack,
  XpFill,
  XpLabel,
  StatusRow,
  MomentumBadge,
  StreakText,
  NextMilestone,
  ProfileBadge,
} from './styled';

interface HeroSectionProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

function getActiveDaysThisMonth(daily: ProcessedStats['daily']): number {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  return daily.filter((d) => d.date.startsWith(prefix) && d.count > 0).length;
}

function formatXP(n: number): string {
  return n.toLocaleString('es-AR');
}

const HeroSection: React.FC<HeroSectionProps> = ({ activities, stats }) => {
  const permissions = computePermissions(stats);
  const totalUnlockedTiers = permissions.reduce((s, p) => s + p.unlockedTiers, 0);
  const xp = computeXP(stats, totalUnlockedTiers);
  const level = getLevelInfo(xp);
  const momentum = computeMomentum(stats.weekly);
  const nextText = getNextMilestoneText(permissions, 0);
  const profile = computeRunnerProfile(activities, stats);

  const streakNarrative = (() => {
    if (stats.currentStreak >= 3) {
      return (
        <>
          <strong>{stats.currentStreak} días</strong> activos seguidos
        </>
      );
    }
    const activeDays = getActiveDaysThisMonth(stats.daily);
    if (activeDays > 0) {
      return (
        <>
          <strong>{activeDays} día{activeDays > 1 ? 's' : ''}</strong> activo{activeDays > 1 ? 's' : ''} este mes
        </>
      );
    }
    return <>sin actividad reciente</>;
  })();

  const MomentumIcon =
    momentum?.state === 'subiendo'
      ? IconTrendUp
      : momentum?.state === 'bajando'
      ? IconTrendDown
      : IconTrendFlat;

  const xpNextLabel = level.nextThreshold
    ? `${formatXP(xp)} / ${formatXP(level.nextThreshold)} XP`
    : `${formatXP(xp)} XP`;

  return (
    <HeroCard>
      <LevelRow>
        <LevelLabel>Nivel {level.level}</LevelLabel>
        <LevelName>{level.name}</LevelName>
        {profile && <ProfileBadge>{profile.label}</ProfileBadge>}
        <XpRow>
          <XpTrack>
            <XpFill $pct={level.progress} />
          </XpTrack>
          <XpLabel>{xpNextLabel}</XpLabel>
        </XpRow>
      </LevelRow>

      <StatusRow>
        {momentum && (
          <MomentumBadge $state={momentum.state}>
            <MomentumIcon size={14} color="currentColor" />
            {momentumLabel(momentum)}
          </MomentumBadge>
        )}
        <StreakText>{streakNarrative}</StreakText>
      </StatusRow>

      {nextText && (
        <NextMilestone>
          Lo que sigue: <strong>{nextText}</strong>
        </NextMilestone>
      )}
    </HeroCard>
  );
};

export default HeroSection;
