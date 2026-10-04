/**
 * Barra de secciones inferior (mobile).
 *
 * La barra en sí —visibilidad por ancho, offset, foco, marca del activo— es de
 * `kaizen-lib` y se testea allá. Lo que se fija acá es lo que decide este
 * repo: que muestre las mismas secciones que la topbar —salen de `NAV_ITEMS`,
 * no de una copia— y cuál marca como activa. Que se vea sólo en el teléfono
 * es CSS: jsdom no evalúa media queries, así que la barra queda en su
 * `display: none` de base y se consulta con `hidden: true`.
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

function activas() {
  return screen
    .getAllByRole('link', { hidden: true })
    .filter(link => link.getAttribute('aria-current') === 'page')
    .map(link => link.textContent);
}

describe('BottomNav', () => {
  it('muestra las secciones de la topbar, en su orden y con su destino', () => {
    enRuta('/');

    const links = screen.getAllByRole('link', { hidden: true });
    expect(links.map(l => [l.textContent, l.getAttribute('href')])).toEqual(
      NAV_ITEMS.map(i => [i.label, i.href]),
    );
  });

  it('marca como actual sólo la sección de la ruta', () => {
    enRuta('/achievements');

    expect(activas()).toEqual(['Logros']);
  });

  it('no marca Progreso en otra sección aunque `/` sea prefijo de su ruta', () => {
    enRuta('/mapa');

    expect(activas()).toEqual(['Mapa']);
  });

  it('no marca ninguna en una ruta que no es sección', () => {
    enRuta('/achievements/detalle');

    expect(activas()).toEqual([]);
  });
});
