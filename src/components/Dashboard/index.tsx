'use client';

import React, { useEffect, useState, useState as useStateReact } from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import HeroSection from '@/components/HeroSection';
import ActiveMission from '@/components/ActiveMission';
import EstadoActual from '@/components/EstadoActual';
import GamificationPanel from '@/components/GamificationPanel';
import NumbersSection from '@/components/NumbersSection';
import ActivityHeatmap from '@/components/charts/ActivityHeatmap';
import HourlyDistributionChart from '@/components/charts/HourlyDistributionChart';
import WeekdayDistributionChart from '@/components/charts/WeekdayDistributionChart';
import PerformanceTabs from '@/components/charts/PerformanceTabs';
import CollapsibleSection from '@/components/CollapsibleSection';
import { IconRun, IconRefresh, IconLogout } from '@/components/Icon';
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
  const [isMounted, setIsMounted] = useStateReact(false);
  const isMobile = useIsMobile(isMounted);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

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
          {stats.currentStreak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>🔥</span>
              <span>{Math.ceil(stats.currentStreak / 7)} sem</span>
            </div>
          )}
          {isFromCache && cacheAge !== null && (
            <CacheInfo>Actualizado {formatCacheAge(cacheAge)}</CacheInfo>
          )}
          <HeaderButton $variant="ghost" onClick={onRefresh} disabled={loading}>
            <span className="only-icon-mobile">
              {loading ? <Spinner style={{ width: 20, height: 20 }} /> : <IconRefresh size={20} color="var(--text-secondary)" />}
            </span>
            <span className="only-text-desktop">
              {loading ? 'Actualizando...' : 'Actualizar datos'}
            </span>
          </HeaderButton>
          <HeaderButton $variant="ghost" onClick={onLogout}>
            <span className="only-icon-mobile">
              <IconLogout size={20} color="var(--text-secondary)" />
            </span>
            <span className="only-text-desktop">
              Cambiar token
            </span>
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

              <EstadoActual stats={stats} />

              <NumbersSection activities={activities} stats={stats} />
              
              <section>
                <FullWidthChart>
                  <ActivityHeatmap
                    data={stats.daily}
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

function useIsMobile(isMounted: boolean) {
  const [isMobile, setIsMobile] = useStateReact(false);
  useEffect(() => {
    if (!isMounted) return;
    const check = () => setIsMobile(window.innerWidth <= 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [isMounted]);
  return isMobile;
}
