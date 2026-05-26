'use client';

import React, { useState } from 'react';
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
import CollapsibleSection from '@/components/CollapsibleSection';
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
  HomeTabsBar,
  HomeTabsInner,
  HomeTabBtn,
  DashboardContent,
  PatternsGrid,
  FullWidthChart,
  LoadingOverlay,
  LoadingText,
  LoadingCount,
  Spinner,
} from './styled';

type HomeTab = 'progreso' | 'objetivos';

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
  const [activeTab, setActiveTab] = useState<HomeTab>('progreso');

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

      {!loading && (
        <HomeTabsBar>
          <HomeTabsInner>
            <HomeTabBtn $active={activeTab === 'progreso'} onClick={() => setActiveTab('progreso')}>
              Progreso
            </HomeTabBtn>
            <HomeTabBtn $active={activeTab === 'objetivos'} onClick={() => setActiveTab('objetivos')}>
              Objetivos
            </HomeTabBtn>
          </HomeTabsInner>
        </HomeTabsBar>
      )}

      {loading ? (
        <LoadingOverlay>
          <Spinner />
          <LoadingText>Cargando actividades de Strava</LoadingText>
          {loadingCount > 0 && <LoadingCount>{loadingCount} actividades encontradas...</LoadingCount>}
        </LoadingOverlay>
      ) : (
        <DashboardContent>
          {activeTab === 'progreso' && (
            <>
              <HeroSection stats={stats} />

              {(() => {
                const perms = computePermissions(stats);
                const totalTiers = perms.reduce((s, p) => s + p.unlockedTiers, 0);
                const level = getLevelInfo(computeXP(stats, totalTiers));
                return <PredictionsSection stats={stats} permissions={perms} levelInfo={level} />;
              })()}

              <EstadoActual stats={stats} />

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

              <CollapsibleSection
                title="Patrones y Tendencias"
                subtitle="cómo, cuándo y cuánto entrenás"
                defaultOpen
              >
                <PatternsGrid>
                  <HourlyDistributionChart data={stats.hourlyDistribution} />
                  <WeekdayDistributionChart data={stats.weekdayDistribution} />
                  <PerformanceTabs
                    monthly={stats.monthly}
                    paceEvolution={stats.paceEvolution}
                    cumulativeDistance={stats.cumulativeDistance}
                  />
                </PatternsGrid>
              </CollapsibleSection>

              <RawDataSection stats={stats} />
            </>
          )}

          {activeTab === 'objetivos' && (
            <>
              <ActiveMission stats={stats} />
              <GamificationPanel stats={stats} />
            </>
          )}
        </DashboardContent>
      )}
    </DashboardRoot>
  );
};

export default Dashboard;
