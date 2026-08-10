'use client';

import React, { useEffect, useState as useStateReact } from 'react';
import { usePathname } from 'next/navigation';
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
  HomeTabLink,
  DashboardContent,
  LoadingOverlay,
  LoadingText,
  LoadingCount,
  Spinner,
} from './styled';

/** Una tab por ruta: la URL es la unica fuente de verdad de la tab activa. */
const HOME_TABS = [
  { href: '/', label: 'Progreso' },
  { href: '/achievements', label: 'Logros' },
  { href: '/comparative', label: 'Comparar' },
] as const;

interface DashboardProps {
  loading: boolean;
  loadingCount: number;
  isFromCache: boolean;
  cacheAge: number | null;
  onRefresh: () => void;
  onLogout: () => void;
  children: React.ReactNode;
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
  loading,
  loadingCount,
  isFromCache,
  cacheAge,
  onRefresh,
  onLogout,
  children,
}) => {
  const pathname = usePathname();
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
            <IconRun size={18} color="var(--text-on-accent)" />
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
            {HOME_TABS.map(tab => {
              const isActive = pathname === tab.href;
              return (
                <HomeTabLink
                  key={tab.href}
                  href={tab.href}
                  $active={isActive}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.label}
                </HomeTabLink>
              );
            })}
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
        <DashboardContent>{children}</DashboardContent>
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
