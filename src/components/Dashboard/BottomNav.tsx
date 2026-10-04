'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BottomNav as BarraInferior } from 'kaizen-lib/ui';
import { NAV_ITEMS, CORTE_MOVIL_PX, isNavItemActive } from './navItems';

/**
 * Las secciones de la app en la barra inferior de `kaizen-lib`, sólo en el
 * teléfono: ahí reemplaza a la nav de la topbar, que se oculta en el mismo
 * corte (ver `HeaderNav`). La barra, su visibilidad y el offset que publica
 * para no tapar contenido son de la librería; acá se decide qué secciones hay
 * y cuál está activa.
 */
const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const activa = NAV_ITEMS.find(item => isNavItemActive(pathname, item.href));

  return (
    <BarraInferior
      items={NAV_ITEMS.map(item => ({
        id: item.href,
        label: item.label,
        icon: <item.Icon size={22} color="currentColor" />,
        href: item.href,
      }))}
      activeId={activa?.href ?? null}
      maxWidth={CORTE_MOVIL_PX}
      ariaLabel="Secciones"
      linkAs={Link}
    />
  );
};

export default BottomNav;
