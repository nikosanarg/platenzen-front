'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import HeroSection from '@/components/HeroSection';
import ActiveMission from '@/components/ActiveMission';
import GamificationPanel from '@/components/GamificationPanel';
import PersonalRecords from '@/components/PersonalRecords';
import InsightsSection from '@/components/InsightsSection';
import WeeklyDistanceChart from '@/components/charts/WeeklyDistanceChart';
import MonthlyComparisonChart from '@/components/charts/MonthlyComparisonChart';
import PaceEvolutionChart from '@/components/charts/PaceEvolutionChart';
import CumulativeDistanceChart from '@/components/charts/CumulativeDistanceChart';
import ActivityHeatmap from '@/components/charts/ActivityHeatmap';
import HourlyDistributionChart from '@/components/charts/HourlyDistributionChart';
import WeekdayDistributionChart from '@/components/charts/WeekdayDistributionChart';
import { IconRun } from '@/components/Icon';
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
          <HeaderLogo>
            <IconRun size={18} color="#fff" />
          </HeaderLogo>
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
          <HeroSection stats={stats} />

          <ActiveMission stats={stats} />

          <GamificationPanel stats={stats} />

          <PersonalRecords activities={activities} stats={stats} />

          <section>
            <FullWidthChart>
              <ActivityHeatmap data={stats.daily} />
            </FullWidthChart>
          </section>

          <section>
            <SectionTitle>Tus patrones</SectionTitle>
            <ChartsGrid>
              <HourlyDistributionChart data={stats.hourlyDistribution} />
              <WeekdayDistributionChart data={stats.weekdayDistribution} />
            </ChartsGrid>
          </section>

          <section>
            <SectionTitle>Cómo venís</SectionTitle>
            <ChartsGrid>
              <WeeklyDistanceChart data={stats.monthly} />
              <MonthlyComparisonChart data={stats.monthly} />
              {stats.paceEvolution.length > 0 && <PaceEvolutionChart data={stats.paceEvolution} />}
              <CumulativeDistanceChart data={stats.cumulativeDistance} />
            </ChartsGrid>
          </section>

          <InsightsSection stats={stats} />
        </DashboardContent>
      )}
    </DashboardRoot>
  );
};

export default Dashboard;
