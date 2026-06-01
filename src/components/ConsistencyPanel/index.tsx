'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeConsistencyStats } from '@/lib/consistencyStats';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  ConsistencyRoot,
  StatsGrid,
  StatCard,
  StatValue,
  StatLabel,
  StatSub,
} from './styled';

interface ConsistencyPanelProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const ConsistencyPanel: React.FC<ConsistencyPanelProps> = ({ activities, stats }) => {
  const cs = computeConsistencyStats(activities, stats);
  if (stats.totalActivities === 0) return null;

  const hourLabel =
    cs.mostFrequentHour !== null
      ? `${cs.mostFrequentHour.toString().padStart(2, '0')}:00 hs`
      : null;

  return (
    <ConsistencyRoot>
      <SectionTitle>Consistencia</SectionTitle>
      <StatsGrid>
        <StatCard>
          <StatValue>{cs.consecutiveWeeks}</StatValue>
          <StatLabel>Semanas activas seguidas</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{cs.monthsWithActivity}</StatValue>
          <StatLabel>Meses con actividad</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue>{cs.avgActivitiesPerWeek}</StatValue>
          <StatLabel>Salidas por semana</StatLabel>
          <StatSub>promedio últimas 12 sem.</StatSub>
        </StatCard>

        <StatCard>
          <StatValue>
            {cs.activeWeeksLast12} / {cs.totalWeeksLast12}
          </StatValue>
          <StatLabel>Semanas activas</StatLabel>
          <StatSub>en las últimas {cs.totalWeeksLast12} semanas</StatSub>
        </StatCard>

        {cs.favoriteDays.length > 0 && (
          <StatCard>
            <StatValue>{cs.favoriteDays.join(' y ')}</StatValue>
            <StatLabel>Días favoritos</StatLabel>
          </StatCard>
        )}

        {hourLabel && (
          <StatCard>
            <StatValue>{hourLabel}</StatValue>
            <StatLabel>Hora más frecuente</StatLabel>
          </StatCard>
        )}
      </StatsGrid>
    </ConsistencyRoot>
  );
};

export default ConsistencyPanel;
