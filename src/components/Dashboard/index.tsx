'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { kmToString, secondsToHMS } from '@/utils/units';
import { secPerKmToString } from '@/utils/pace';
import StatsCard from '@/components/StatsCard';
import TopActivities from '@/components/TopActivities';
import InsightsSection from '@/components/InsightsSection';
import WeeklyDistanceChart from '@/components/charts/WeeklyDistanceChart';
import MonthlyComparisonChart from '@/components/charts/MonthlyComparisonChart';
import PaceEvolutionChart from '@/components/charts/PaceEvolutionChart';
import CumulativeDistanceChart from '@/components/charts/CumulativeDistanceChart';
import ActivityHeatmap from '@/components/charts/ActivityHeatmap';
import SportDistributionChart from '@/components/charts/SportDistributionChart';
import HourlyDistributionChart from '@/components/charts/HourlyDistributionChart';
import WeekdayDistributionChart from '@/components/charts/WeekdayDistributionChart';
import {
  DashboardRoot,
  DashboardHeader,
  HeaderLeft,
  HeaderLogo,
  HeaderTitle,
  HeaderRight,
  CacheInfo,
  HeaderButton,
  DashboardContent,
  SectionTitle,
  StatsGrid,
  ChartsGrid,
  FullWidthChart,
  LoadingOverlay,
  LoadingText,
  LoadingCount,
  Spinner,
} from './styled';

interface DashboardProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
  loading: boolean;
  loadingCount: number;
  isFromCache: boolean;
  cacheAge: number | null;
  onRefresh: () => void;
  onLogout: () => void;
}

function formatCacheAge(ms: number): string {
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'hace menos de un minuto';
  if (min === 1) return 'hace 1 minuto';
  if (min < 60) return `hace ${min} minutos`;
  const h = Math.floor(min / 60);
  return `hace ${h}h`;
}

const Dashboard: React.FC<DashboardProps> = ({
  activities,
  stats,
  loading,
  loadingCount,
  isFromCache,
  cacheAge,
  onRefresh,
  onLogout,
}) => {
  return (
    <DashboardRoot>
      <DashboardHeader>
        <HeaderLeft>
          <HeaderLogo>🏃</HeaderLogo>
          <HeaderTitle>Platenzen</HeaderTitle>
        </HeaderLeft>
        <HeaderRight>
          {isFromCache && cacheAge !== null && (
            <CacheInfo>Actualizado {formatCacheAge(cacheAge)}</CacheInfo>
          )}
          <HeaderButton $variant="ghost" onClick={onRefresh} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar datos'}
          </HeaderButton>
          <HeaderButton $variant="ghost" onClick={onLogout}>
            Cambiar token
          </HeaderButton>
        </HeaderRight>
      </DashboardHeader>

      {loading ? (
        <LoadingOverlay>
          <Spinner />
          <LoadingText>Cargando actividades de Strava</LoadingText>
          {loadingCount > 0 && <LoadingCount>{loadingCount} actividades encontradas...</LoadingCount>}
        </LoadingOverlay>
      ) : (
        <DashboardContent>
          <section>
            <SectionTitle>Resumen general</SectionTitle>
            <StatsGrid>
              <StatsCard label="Distancia total" value={kmToString(stats.totalDistance)} icon="📏" />
              <StatsCard label="Tiempo total" value={secondsToHMS(stats.totalTime)} icon="⏱️" />
              <StatsCard label="Actividades" value={stats.totalActivities.toString()} icon="🎯" />
              <StatsCard label="Promedio semanal" value={kmToString(stats.weeklyAvgDistance)} icon="📅" sub="km/semana" />
              <StatsCard label="Ritmo promedio" value={secPerKmToString(stats.avgPace)} icon="🏃" sub="running" />
              <StatsCard label="Mejor ritmo" value={secPerKmToString(stats.bestPace)} icon="⚡" sub="running" />
              <StatsCard label="Actividad más larga" value={kmToString(stats.longestActivity)} icon="🗺️" />
              <StatsCard label="Racha actual" value={`${stats.currentStreak} días`} icon="🔥" sub={`récord: ${stats.longestStreak} días`} />
            </StatsGrid>
          </section>

          <section>
            <SectionTitle>Evolución y tendencias</SectionTitle>
            <ChartsGrid>
              <WeeklyDistanceChart data={stats.monthly} />
              <MonthlyComparisonChart data={stats.monthly} />
              {stats.paceEvolution.length > 0 && <PaceEvolutionChart data={stats.paceEvolution} />}
              <CumulativeDistanceChart data={stats.cumulativeDistance} />
            </ChartsGrid>
          </section>

          <section>
            <FullWidthChart>
              <ActivityHeatmap data={stats.daily} />
            </FullWidthChart>
          </section>

          <section>
            <SectionTitle>Distribución</SectionTitle>
            <ChartsGrid>
              <SportDistributionChart data={stats.sportDistribution} />
              <HourlyDistributionChart data={stats.hourlyDistribution} />
              <WeekdayDistributionChart data={stats.weekdayDistribution} />
            </ChartsGrid>
          </section>

          <TopActivities activities={activities} />

          <InsightsSection stats={stats} />
        </DashboardContent>
      )}
    </DashboardRoot>
  );
};

export default Dashboard;
