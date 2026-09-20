/**
 * El conmutador del perfil de corredor en la card de la Home.
 *
 * Radar y árbol dibujan el mismo cálculo de `branchTree`, así que lo que se
 * verifica acá no es qué dibuja cada uno —eso lo cubre `branchTree.test.ts`—
 * sino que sean dos lecturas de una sola pieza: una visible por vez, con el
 * conmutador diciendo cuál, y las dos alimentadas por las mismas actividades.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import PersonajeCard from '@/components/PersonajeCard';
import { computeStats } from '@/lib/stats';
import { activity } from '@/__tests__/helpers/activity';
import { Activity } from '@/types/activity';

const NOW = new Date('2026-07-15T12:00:00Z');

/** Un historial chico pero real: alcanza para que el árbol tenga nodos abiertos. */
function historial(): Activity[] {
  return Array.from({ length: 30 }, (_, i) => {
    const iso = new Date(NOW.getTime() - i * 3 * 86400000).toISOString();
    return activity({
      id: i + 1,
      distance: 10000,
      moving_time: 3000,
      start_date: iso,
      start_date_local: iso,
    });
  });
}

function renderCard() {
  const activities = historial();
  return render(<PersonajeCard activities={activities} stats={computeStats(activities)} />);
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

const HINT_ARBOL = /Las habilidades se desbloquean solas/;
/** El pie del radar, en cualquiera de sus dos redacciones. */
const PIE_RADAR = /Dónde quedarías si dejaras de correr|Tu progreso no vence/;

it('arranca en el radar, con el árbol fuera de la pantalla', () => {
  renderCard();

  expect(screen.getByRole('tab', { name: 'Radar' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: 'Árbol' })).toHaveAttribute('aria-selected', 'false');
  expect(screen.getByText(PIE_RADAR)).toBeInTheDocument();
  expect(screen.queryByText(HINT_ARBOL)).not.toBeInTheDocument();
});

it('conmutar a Árbol reemplaza al radar en el mismo panel', () => {
  renderCard();
  const panel = screen.getByRole('tabpanel');

  fireEvent.click(screen.getByRole('tab', { name: 'Árbol' }));

  expect(screen.getByRole('tab', { name: 'Árbol' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: 'Radar' })).toHaveAttribute('aria-selected', 'false');
  expect(panel).toContainElement(screen.getByText(HINT_ARBOL));
  expect(screen.queryByText(PIE_RADAR)).not.toBeInTheDocument();
});

it('vuelve al radar cuando se lo elige de nuevo', () => {
  renderCard();

  fireEvent.click(screen.getByRole('tab', { name: 'Árbol' }));
  fireEvent.click(screen.getByRole('tab', { name: 'Radar' }));

  expect(screen.getByRole('tab', { name: 'Radar' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText(PIE_RADAR)).toBeInTheDocument();
  expect(screen.queryByText(HINT_ARBOL)).not.toBeInTheDocument();
});

it('las seis ramas y sus porcentajes son los mismos en las dos vistas', () => {
  renderCard();
  const etiquetas = () =>
    ['Resistencia', 'Fondo', 'Velocidad', 'Consistencia', 'Exploración', 'Desnivel'].map(
      r => within(screen.getByRole('tabpanel')).getByText(r).nextElementSibling?.textContent,
    );

  const enRadar = etiquetas();
  fireEvent.click(screen.getByRole('tab', { name: 'Árbol' }));

  expect(enRadar.every(p => /^\d+%$/.test(p ?? ''))).toBe(true);
  expect(etiquetas()).toEqual(enRadar);
});

it('el árbol dibuja tres nodos por rama, uno en cada anillo', () => {
  renderCard();

  fireEvent.click(screen.getByRole('tab', { name: 'Árbol' }));

  expect(screen.getAllByRole('button', { name: /nivel [123]/ })).toHaveLength(18);
});
