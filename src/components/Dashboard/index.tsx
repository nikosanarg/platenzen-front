'use client';

import React, { useEffect, useState, useState as useStateReact } from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import PersonajeCard from '@/components/PersonajeCard';
import CoachPersonalizado from '@/components/CoachPersonalizado';
import RecordHistorySection from '@/components/RecordHistorySection';
import RacePredictorTable from '@/components/RacePredictorTable';
import InsightsSection from '@/components/InsightsSection';
import PeriodComparator from '@/components/PeriodComparator';
import AchievementShowcase from '@/components/AchievementShowcase';
import ActivityHeatmap from '@/components/charts/ActivityHeatmap';
import HourlyDistributionChart from '@/components/charts/HourlyDistributionChart';
import WeekdayDistributionChart from '@/components/charts/WeekdayDistributionChart';
import PerformanceTabs from '@/components/charts/PerformanceTabs';
import CollapsibleSection from '@/components/CollapsibleSection';
import UltimaActividad from '@/components/UltimaActividad';
import SesionesLegendarias from '@/components/SesionesLegendarias';
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
  ButtonText,
  HomeTabsBar,
  HomeTabsInner,
  HomeTabBtn,
  SectionTitle,
  DashboardContent,
  PatternsGrid,
  FullWidthChart,
  LoadingOverlay,
  LoadingText,
  LoadingCount,
  Spinner,
} from './styled';

type HomeTab = 'progreso' | 'objetivos' | 'comparar';

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

  void isMobile;

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
            {loading ? <Spinner style={{ width: 20, height: 20 }} /> : <IconRefresh size={20} color="currentColor" />}
            <ButtonText>{loading ? 'Actualizando...' : 'Actualizar datos'}</ButtonText>
          </HeaderButton>
          <HeaderButton $variant="ghost" $mobileRed onClick={onLogout}>
            <IconLogout size={20} color="currentColor" />
            <ButtonText>Cambiar token</ButtonText>
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
            <HomeTabBtn $active={activeTab === 'comparar'} onClick={() => setActiveTab('comparar')}>
              Comparar
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
              <PersonajeCard activities={activities} stats={stats} />

              <CoachPersonalizado activities={activities} stats={stats} />

              <UltimaActividad activities={activities} stats={stats} />

              <RecordHistorySection activities={activities} />

              <SesionesLegendarias activities={activities} stats={stats} />

              <section>
                <SectionTitle>Tu año en actividad</SectionTitle>
                <FullWidthChart>
                  <ActivityHeatmap data={stats.daily} />
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
                <InsightsSection activities={activities} stats={stats} />
              </CollapsibleSection>
            </>
          )}

          {activeTab === 'objetivos' && (
            <AchievementShowcase activities={activities} stats={stats} />
          )}

          {activeTab === 'comparar' && (
            <>
              <PeriodComparator activities={activities} />
              <RacePredictorTable activities={activities} />
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
