'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import HeroSection from '@/components/HeroSection';
import ActiveMission from '@/components/ActiveMission';
import EstadoActual from '@/components/EstadoActual';
import GamificationPanel from '@/components/GamificationPanel';
import PersonalRecords from '@/components/PersonalRecords';
import PredictionsSection from '@/components/PredictionsSection';
import { computePermissions } from '@/lib/gamification';
import { computeXP, getLevelInfo } from '@/lib/levels';
import ActivityHeatmap from '@/components/charts/ActivityHeatmap';
import HourlyDistributionChart from '@/components/charts/HourlyDistributionChart';
import WeekdayDistributionChart from '@/components/charts/WeekdayDistributionChart';
import PerformanceTabs from '@/components/charts/PerformanceTabs';
import RawDataSection from '@/components/RawDataSection';
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

          {(() => {
            const perms = computePermissions(stats);
            const totalTiers = perms.reduce((s, p) => s + p.unlockedTiers, 0);
            const level = getLevelInfo(computeXP(stats, totalTiers));
            return <PredictionsSection stats={stats} permissions={perms} levelInfo={level} />;
          })()}

          <EstadoActual stats={stats} />

          <GamificationPanel stats={stats} />

          <PersonalRecords activities={activities} stats={stats} />

          <section>
            <FullWidthChart>
              <ActivityHeatmap
                data={stats.daily}
                currentStreak={stats.currentStreak}
                longestStreak={stats.longestStreak}
              />
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
            <PerformanceTabs
              monthly={stats.monthly}
              paceEvolution={stats.paceEvolution}
              cumulativeDistance={stats.cumulativeDistance}
            />
          </section>

          <RawDataSection stats={stats} />
        </DashboardContent>
      )}
    </DashboardRoot>
  );
};

export default Dashboard;
