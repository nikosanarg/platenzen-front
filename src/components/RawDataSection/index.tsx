'use client';

import React, { useState } from 'react';
import { ProcessedStats } from '@/types/stats';
import { secondsToHMS } from '@/utils/units';
import { secPerKmToString } from '@/utils/pace';
import {
  RawRoot,
  ToggleBtn,
  Chevron,
  StatsPanel,
  StatsGroup,
  GroupTitle,
  StatsRow,
  StatItem,
  StatValue,
  StatLabel,
} from './styled';

interface RawDataSectionProps {
  stats: ProcessedStats;
}

const RawDataSection: React.FC<RawDataSectionProps> = ({ stats }) => {
  const [open, setOpen] = useState(true);

  const bestWeek = stats.weekly.length > 0
    ? Math.max(...stats.weekly.map((w) => w.distance))
    : 0;

  return (
    <RawRoot>
      <ToggleBtn onClick={() => setOpen((v) => !v)}>
        Tus números completos
        <Chevron $open={open}>▼</Chevron>
      </ToggleBtn>

      {open && (
        <StatsPanel>
          <StatsGroup>
            <GroupTitle>Totales</GroupTitle>
            <StatsRow>
              <StatItem>
                <StatValue>{stats.totalDistance.toFixed(1)} km</StatValue>
                <StatLabel>Distancia total</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{secondsToHMS(stats.totalTime)}</StatValue>
                <StatLabel>Tiempo total</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.totalActivities}</StatValue>
                <StatLabel>Actividades</StatLabel>
              </StatItem>
            </StatsRow>
          </StatsGroup>

          <StatsGroup>
            <GroupTitle>Este año</GroupTitle>
            <StatsRow>
              <StatItem>
                <StatValue>{stats.currentYearDistance.toFixed(1)} km</StatValue>
                <StatLabel>Distancia</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.currentYearActivities}</StatValue>
                <StatLabel>Actividades</StatLabel>
              </StatItem>
            </StatsRow>
          </StatsGroup>

          <StatsGroup>
            <GroupTitle>Rendimiento</GroupTitle>
            <StatsRow>
              <StatItem>
                <StatValue>{secPerKmToString(stats.avgPace)}</StatValue>
                <StatLabel>Ritmo promedio</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{secPerKmToString(stats.bestPace)}</StatValue>
                <StatLabel>Mejor ritmo</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.longestActivity.toFixed(1)} km</StatValue>
                <StatLabel>Carrera más larga</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{stats.weeklyAvgDistance.toFixed(1)} km</StatValue>
                <StatLabel>Promedio semanal</StatLabel>
              </StatItem>
              {bestWeek > 0 && (
                <StatItem>
                  <StatValue>{bestWeek.toFixed(1)} km</StatValue>
                  <StatLabel>Mejor semana</StatLabel>
                </StatItem>
              )}
            </StatsRow>
          </StatsGroup>

          <StatsGroup>
            <GroupTitle>Consistencia</GroupTitle>
            <StatsRow>
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
      )}
    </RawRoot>
  );
};

export default RawDataSection;
