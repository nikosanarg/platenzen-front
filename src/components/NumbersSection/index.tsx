'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { SectionTitle } from '@/components/Dashboard/styled';
import RecordsCarousel from '@/components/RecordsCarousel';
import AccumulatedCarousel from '@/components/AccumulatedCarousel';
import {
  StatsPanel,
  StatsGroup,
  GroupTitle,
  StatsRow,
  StatItem,
  StatValue,
  StatLabel,
} from '@/components/RawDataSection/styled';
import { secPerKmToString } from '@/utils/pace';
import styled from 'styled-components';

const NumbersRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

interface NumbersSectionProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const NumbersSection: React.FC<NumbersSectionProps> = ({ activities, stats }) => {
  return (
    <NumbersRoot>
      <SectionTitle>Tus números</SectionTitle>

      <RecordsCarousel activities={activities} stats={stats} />

      <AccumulatedCarousel activities={activities} stats={stats} />

      <StatsPanel>
        <StatsGroup>
          <GroupTitle>Hito Personal</GroupTitle>
          <StatsRow>
            <StatItem>
              <StatValue>{stats.longestActivity.toFixed(1)} km</StatValue>
              <StatLabel>Carrera más larga</StatLabel>
            </StatItem>
          </StatsRow>
        </StatsGroup>

        <StatsGroup>
          <GroupTitle>Consistencia</GroupTitle>
          <StatsRow>
            <StatItem>
              <StatValue>{stats.avgPace ? secPerKmToString(stats.avgPace) : '—'}</StatValue>
              <StatLabel>Ritmo promedio</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats.weeklyAvgDistance.toFixed(1)} km</StatValue>
              <StatLabel>Promedio semanal</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats.currentStreak} días</StatValue>
              <StatLabel>Racha actual</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats.longestStreak} días</StatValue>
              <StatLabel>Racha récord</StatLabel>
            </StatItem>
          </StatsRow>
        </StatsGroup>
      </StatsPanel>
    </NumbersRoot>
  );
};

export default NumbersSection;

