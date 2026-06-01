'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computePersonalGoals } from '@/lib/personalGoals';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  GoalsRoot,
  GoalsList,
  GoalCard,
  GoalLabel,
  ProgressRow,
  ProgressTrack,
  ProgressFill,
  ProgressPct,
  GoalDetail,
} from './styled';

interface PersonalGoalsProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const PersonalGoals: React.FC<PersonalGoalsProps> = ({ activities, stats }) => {
  const goals = computePersonalGoals(activities, stats);
  if (goals.length === 0) return null;

  return (
    <GoalsRoot>
      <SectionTitle>Próximos objetivos</SectionTitle>
      <GoalsList>
        {goals.map(goal => (
          <GoalCard key={goal.id}>
            <GoalLabel>{goal.label}</GoalLabel>
            <ProgressRow>
              <ProgressTrack>
                <ProgressFill $pct={goal.progress} />
              </ProgressTrack>
              <ProgressPct>{Math.round(goal.progress * 100)}%</ProgressPct>
            </ProgressRow>
            <GoalDetail>{goal.progressLabel}</GoalDetail>
          </GoalCard>
        ))}
      </GoalsList>
    </GoalsRoot>
  );
};

export default PersonalGoals;
