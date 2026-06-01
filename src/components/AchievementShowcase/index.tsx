'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import {
  computeAchievements,
  getUpcomingAchievements,
  CATEGORY_LABELS,
  AchievementCategory,
  Achievement,
} from '@/lib/achievements';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  ShowcaseRoot,
  CategoryBlock,
  CategoryTitle,
  AchievementsGrid,
  AchCard,
  AchXP,
  AchName,
  AchDesc,
  AchDate,
  AchProgressRow,
  AchProgressTrack,
  AchProgressFill,
  AchProgressText,
  UpcomingBlock,
  UpcomingList,
  UpcomingRow,
  UpcomingInfo,
  UpcomingName,
  UpcomingProgressTrack,
  UpcomingProgressFill,
  UpcomingProgressText,
  UpcomingPct,
} from './styled';

const CATEGORY_ORDER: AchievementCategory[] = [
  'distance',
  'volume',
  'consistency',
  'speed',
  'exploration',
];

interface AchievementShowcaseProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const AchievementShowcase: React.FC<AchievementShowcaseProps> = ({ activities, stats }) => {
  const achievementMap = computeAchievements(activities, stats);
  const upcoming = getUpcomingAchievements(achievementMap);

  return (
    <ShowcaseRoot>
      <SectionTitle>Vitrina de logros</SectionTitle>

      {/* ── Upcoming ── */}
      {upcoming.length > 0 && (
        <UpcomingBlock>
          <CategoryTitle>Próximos logros</CategoryTitle>
          <UpcomingList>
            {upcoming.map(ach => (
              <UpcomingRow key={ach.id}>
                <UpcomingInfo>
                  <UpcomingName>{ach.name}</UpcomingName>
                  <UpcomingProgressTrack>
                    <UpcomingProgressFill $pct={ach.progress} />
                  </UpcomingProgressTrack>
                  <UpcomingProgressText>{ach.progressText}</UpcomingProgressText>
                </UpcomingInfo>
                <UpcomingPct>{Math.round(ach.progress * 100)}%</UpcomingPct>
              </UpcomingRow>
            ))}
          </UpcomingList>
        </UpcomingBlock>
      )}

      {/* ── Categories ── */}
      {CATEGORY_ORDER.map(cat => {
        const achs = achievementMap[cat];
        if (!achs?.length) return null;
        return (
          <CategoryBlock key={cat}>
            <CategoryTitle>{CATEGORY_LABELS[cat]}</CategoryTitle>
            <AchievementsGrid>
              {achs.map(ach => (
                <AchievementCard key={ach.id} ach={ach} />
              ))}
            </AchievementsGrid>
          </CategoryBlock>
        );
      })}
    </ShowcaseRoot>
  );
};

// ── Achievement card ───────────────────────────────────────────────────────

const AchievementCard: React.FC<{ ach: Achievement }> = ({ ach }) => {
  return (
    <AchCard $unlocked={ach.unlocked} title={ach.unlockedReason}>
      <AchXP $unlocked={ach.unlocked}>+{ach.xp} XP</AchXP>
      <AchName>{ach.name}</AchName>
      <AchDesc>{ach.description}</AchDesc>
      {ach.unlocked && ach.unlockedAt && (
        <AchDate>{formatAchDate(ach.unlockedAt)}</AchDate>
      )}
      {!ach.unlocked && ach.progress > 0 && (
        <AchProgressRow>
          <AchProgressTrack>
            <AchProgressFill $pct={ach.progress} />
          </AchProgressTrack>
          <AchProgressText>{Math.round(ach.progress * 100)}%</AchProgressText>
        </AchProgressRow>
      )}
    </AchCard>
  );
};

function formatAchDate(iso: string): string {
  const [y, mo, d] = iso.slice(0, 10).split('-').map(Number);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${d} ${months[mo - 1]} ${y}`;
}

export default AchievementShowcase;
