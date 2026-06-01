'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeMilestones } from '@/lib/milestones';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  MilestonesRoot,
  MilestonesList,
  MilestoneRow,
  MilestoneTop,
  MilestoneIcon,
  MilestoneInfo,
  MilestoneLabel,
  MilestoneDate,
  XpBadge,
  MilestoneProgressBar,
  MilestoneProgressFill,
  MilestoneProgressLabel,
  SectionDivider,
} from './styled';

interface MilestonesSectionProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const MilestonesSection: React.FC<MilestonesSectionProps> = ({ activities, stats }) => {
  const milestones = computeMilestones(activities, stats);
  const unlocked = milestones.filter(m => m.unlocked);
  const pending = milestones.filter(m => !m.unlocked);

  if (milestones.length === 0) return null;

  return (
    <MilestonesRoot>
      <SectionTitle>Hitos de carrera</SectionTitle>
      <MilestonesList>
        {unlocked.length > 0 && (
          <>
            {unlocked.length > 0 && <SectionDivider>Desbloqueados</SectionDivider>}
            {unlocked.map(m => (
              <MilestoneRow key={m.id} $unlocked>
                <MilestoneTop>
                  <MilestoneIcon $unlocked>✓</MilestoneIcon>
                  <MilestoneInfo>
                    <MilestoneLabel $unlocked>{m.label}</MilestoneLabel>
                    {m.unlockedDate && <MilestoneDate>{m.unlockedDate}</MilestoneDate>}
                  </MilestoneInfo>
                  <XpBadge>+{m.xpReward} XP</XpBadge>
                </MilestoneTop>
              </MilestoneRow>
            ))}
          </>
        )}

        {pending.length > 0 && (
          <>
            <SectionDivider>Próximos</SectionDivider>
            {pending.map(m => (
              <MilestoneRow key={m.id} $unlocked={false}>
                <MilestoneTop>
                  <MilestoneIcon $unlocked={false} style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>○</MilestoneIcon>
                  <MilestoneInfo>
                    <MilestoneLabel $unlocked={false}>{m.label}</MilestoneLabel>
                    <MilestoneDate>{m.description}</MilestoneDate>
                  </MilestoneInfo>
                  <XpBadge style={{ opacity: 0.5 }}>+{m.xpReward} XP</XpBadge>
                </MilestoneTop>
                {m.progress > 0 && m.progress < 1 && (
                  <>
                    <MilestoneProgressBar>
                      <MilestoneProgressFill $pct={m.progress} />
                    </MilestoneProgressBar>
                    {m.progressLabel && (
                      <MilestoneProgressLabel>{m.progressLabel}</MilestoneProgressLabel>
                    )}
                  </>
                )}
              </MilestoneRow>
            ))}
          </>
        )}
      </MilestonesList>
    </MilestonesRoot>
  );
};

export default MilestonesSection;
