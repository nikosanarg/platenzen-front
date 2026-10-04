'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, isNavItemActive } from './navItems';
import { BottomNavBar, BottomNavLink, BottomNavLabel, BottomNavOffset } from './styled';

/**
 * Barra de secciones fija abajo, sólo en el teléfono: ahí reemplaza a la nav
 * de la topbar, que se oculta en el mismo corte (ver `HeaderNav`). Se queda
 * siempre montada y se apaga por CSS, igual que la nav de arriba, para que
 * las dos cambien juntas sin depender de medir la ventana desde JS.
 *
 * `BottomNavOffset` publica en `:root` cuánto ocupa la barra mientras está
 * montada y visible: el contenido y los avisos flotantes de la PWA se corren
 * hacia arriba con ese valor en vez de quedar tapados.
 */
const BottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <>
      <BottomNavOffset />
      <BottomNavBar aria-label="Secciones">
        {NAV_ITEMS.map(item => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <BottomNavLink
              key={item.href}
              href={item.href}
              $active={active}
              aria-current={active ? 'page' : undefined}
            >
              <item.Icon size={22} color="currentColor" />
              <BottomNavLabel>{item.label}</BottomNavLabel>
            </BottomNavLink>
          );
        })}
      </BottomNavBar>
    </>
  );
};

export default BottomNav;
