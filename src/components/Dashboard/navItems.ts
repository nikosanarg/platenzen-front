import React from 'react';
import { IconRun, IconMedal, IconCalendar, IconCompass } from '@/components/Icon';

/**
 * Las secciones de la app, compartidas por la nav de la topbar (desktop) y la
 * barra inferior (mobile, `BottomNav`). Una sola lista para que agregar o
 * reordenar una sección no signifique tocar dos lugares que tienen que quedar
 * sincronizados a mano.
 */
export interface NavItem {
  href: string;
  label: string;
  Icon: React.FC<{ size?: number; color?: string }>;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Progreso', Icon: IconRun },
  { href: '/achievements', label: 'Logros', Icon: IconMedal },
  { href: '/comparative', label: 'Comparar', Icon: IconCalendar },
  { href: '/mapa', label: 'Mapa', Icon: IconCompass },
];

/**
 * Coincidencia exacta: la URL es la única fuente de verdad de la sección
 * activa. No se compara por prefijo porque `/` lo sería de todas.
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href;
}
