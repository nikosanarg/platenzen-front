'use client';

import React, { useEffect, useState as useStateReact } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconButton, Relieve } from 'kaizen-lib/ui';
import { IconRefresh, IconLogout, IconDownload, IconUser } from '@/components/Icon';
import { useBotonInstalacionInline } from '@/components/pwa/useInstalacionPWA';
import BottomNav from './BottomNav';
import { NAV_ITEMS, isNavItemActive } from './navItems';
import {
  DashboardRoot,
  DashboardHeader,
  HeaderLeft,
  HeaderLogo,
  HeaderTitle,
  HeaderRight,
  HeaderNav,
  HeaderNavLink,
  CacheInfo,
  DashboardContent,
  LoadingOverlay,
  LoadingRow,
  LoadingText,
  LoadingCount,
  Spinner,
} from './styled';

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
  // Antes del `return null` de abajo: los hooks no pueden quedar detrás de una
  // salida temprana.
  const { sePuedeInstalar, instalar } = useBotonInstalacionInline();

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
            <Image src="/assets/platenzen_logo.png" alt="" width={32} height={32} />
          </HeaderLogo>
          <HeaderTitle>Platenzen</HeaderTitle>
        </HeaderLeft>
        <HeaderNav aria-label="Secciones">
          {NAV_ITEMS.map(tab => {
            const isActive = isNavItemActive(pathname, tab.href);
            return (
              <HeaderNavLink
                key={tab.href}
                href={tab.href}
                $active={isActive}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.label}
              </HeaderNavLink>
            );
          })}
        </HeaderNav>
        <HeaderRight>
          {isFromCache && cacheAge !== null && (
            <CacheInfo>Actualizado {formatCacheAge(cacheAge)}</CacheInfo>
          )}
          {/*
            Va primero a propósito: instalar la app es lo que hace que el historial
            sobreviva y que se abra sin navegador, y una vez adentro del dashboard nadie
            sale a buscarlo. Desaparece solo cuando ya está instalada.
          */}
          {sePuedeInstalar && (
            <Relieve $prendido>
              <IconButton label="Instalar app" active onClick={instalar}>
                <IconDownload size={20} color="currentColor" />
              </IconButton>
            </Relieve>
          )}
          <Relieve>
            <IconButton
              label={loading ? 'Actualizando datos…' : 'Actualizar datos'}
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? <Spinner style={{ width: 20, height: 20 }} /> : <IconRefresh size={20} color="currentColor" />}
            </IconButton>
          </Relieve>
          {/* El perfil del club no es una sección más: se configura una vez y queda. */}
          <Relieve $prendido={pathname === '/profile'}>
            <IconButton as={Link} href="/profile" label="Perfil del club" active={pathname === '/profile'}>
              <IconUser size={20} color="currentColor" />
            </IconButton>
          </Relieve>
          <Relieve>
            <IconButton label="Desconectar" onClick={onLogout}>
              <IconLogout size={20} color="currentColor" />
            </IconButton>
          </Relieve>
        </HeaderRight>
      </DashboardHeader>

      {loading ? (
        <LoadingOverlay>
          <LoadingRow>
            <Spinner style={{ width: 20, height: 20 }} />
            <LoadingText>Cargando actividades</LoadingText>
          </LoadingRow>
          {loadingCount > 0 && <LoadingCount>{loadingCount} actividades encontradas...</LoadingCount>}
        </LoadingOverlay>
      ) : (
        <DashboardContent>{children}</DashboardContent>
      )}

      <BottomNav />
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
