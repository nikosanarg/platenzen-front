/**
 * Barra de secciones inferior (mobile).
 *
 * Lo que se fija: que muestre las mismas secciones que la topbar —salen de
 * `NAV_ITEMS`, no de una copia— y que marque como activa la de la ruta actual.
 * Que se vea sólo en el teléfono es CSS: jsdom no evalúa media queries, así
 * que la barra queda en su `display: none` de base y se consulta con
 * `hidden: true`.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import BottomNav from '@/components/Dashboard/BottomNav';
import { NAV_ITEMS } from '@/components/Dashboard/navItems';

let mockPathname = '/';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

function enRuta(ruta: string) {
  mockPathname = ruta;
  return render(<BottomNav />);
}

describe('BottomNav', () => {
  it('muestra las cuatro secciones de la topbar, con su destino', () => {
    enRuta('/');

    const links = screen.getAllByRole('link', { hidden: true });
    expect(links.map(l => l.getAttribute('href'))).toEqual(NAV_ITEMS.map(i => i.href));
    expect(screen.getByRole('link', { name: 'Progreso', hidden: true })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Logros', hidden: true })).toHaveAttribute('href', '/achievements');
    expect(screen.getByRole('link', { name: 'Comparar', hidden: true })).toHaveAttribute('href', '/comparative');
    expect(screen.getByRole('link', { name: 'Mapa', hidden: true })).toHaveAttribute('href', '/mapa');
  });

  it('marca como actual sólo la sección de la ruta', () => {
    enRuta('/achievements');

    expect(screen.getByRole('link', { name: 'Logros', hidden: true })).toHaveAttribute('aria-current', 'page');
    for (const nombre of ['Progreso', 'Comparar', 'Mapa']) {
      expect(screen.getByRole('link', { name: nombre, hidden: true })).not.toHaveAttribute('aria-current');
    }
  });

  it('no marca Progreso en otra sección aunque `/` sea prefijo de su ruta', () => {
    enRuta('/mapa');

    expect(screen.getByRole('link', { name: 'Mapa', hidden: true })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Progreso', hidden: true })).not.toHaveAttribute('aria-current');
  });

  it('es una navegación con nombre accesible', () => {
    enRuta('/');

    expect(screen.getByRole('navigation', { hidden: true })).toHaveAttribute('aria-label', 'Secciones');
  });
});
