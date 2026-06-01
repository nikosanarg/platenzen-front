'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import {
  computeAchievements,
  CATEGORY_LABELS,
  AchievementCategory,
  Achievement,
} from '@/lib/achievements';
import {
  ShowcaseRoot,
  CategoryBlock,
  CategoryTitle,
  StepperRow,
  StepLine,
  StepCard,
  StepDot,
  StepXP,
  StepName,
  StepDate,
  StepProgressTrack,
  StepProgressFill,
  StepProgressText,
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

// ── Stepper renderer ───────────────────────────────────────────────────────

function Stepper({ achs }: { achs: Achievement[] }) {
  const currentIdx = achs.findIndex(a => !a.unlocked);
  return (
    <StepperRow>
      {achs.map((ach, i) => (
        <React.Fragment key={ach.id}>
          <StepCard
            $unlocked={ach.unlocked}
            $isCurrent={i === currentIdx}
            title={ach.unlockedReason}
          >
            {/* Dot must be first child — StepLine margin-top depends on its fixed Y */}
            <StepDot $unlocked={ach.unlocked} />
            <StepXP $unlocked={ach.unlocked}>+{ach.xp} XP</StepXP>
            <StepName>{ach.name}</StepName>

            {ach.unlocked && ach.unlockedAt && (
              <StepDate>{formatDate(ach.unlockedAt)}</StepDate>
            )}

            {!ach.unlocked && ach.progress > 0 && (
              <>
                <StepProgressTrack>
                  <StepProgressFill $pct={ach.progress} />
                </StepProgressTrack>
                <StepProgressText>{ach.progressText}</StepProgressText>
              </>
            )}
          </StepCard>

          {i < achs.length - 1 && (
            <StepLine $active={achs[i + 1].unlocked} />
          )}
        </React.Fragment>
      ))}
    </StepperRow>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

const AchievementShowcase: React.FC<AchievementShowcaseProps> = ({ activities, stats }) => {
  const achievementMap = computeAchievements(activities, stats);

  return (
    <ShowcaseRoot>
      {CATEGORY_ORDER.map(cat => {
        const achs = achievementMap[cat];
        if (!achs?.length) return null;

        // Consistencia: render as 3 independent steppers stacked vertically
        if (cat === 'consistency') {
          const groups = [
            achs.filter(a => a.id.startsWith('act')),
            achs.filter(a => a.id.startsWith('week')),
            achs.filter(a => a.id.startsWith('month')),
          ].filter(g => g.length > 0);

          return (
            <CategoryBlock key={cat}>
              <CategoryTitle>{CATEGORY_LABELS[cat]}</CategoryTitle>
              {groups.map((group, gi) => (
                <Stepper key={gi} achs={group} />
              ))}
            </CategoryBlock>
          );
        }

        return (
          <CategoryBlock key={cat}>
            <CategoryTitle>{CATEGORY_LABELS[cat]}</CategoryTitle>
            <Stepper achs={achs} />
          </CategoryBlock>
        );
      })}
    </ShowcaseRoot>
  );
};

function formatDate(iso: string): string {
  const [y, mo, d] = iso.slice(0, 10).split('-').map(Number);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${d} ${months[mo - 1]} ${y}`;
}

export default AchievementShowcase;
