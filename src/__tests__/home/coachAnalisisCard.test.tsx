/**
 * La card del coach en la Home: sin el header fijo ("Análisis del Coach") ni
 * la agenda de ayer→+72h, y con el historial de actividades embebido debajo
 * de la última salida, en vez de vivir en una sección aparte de la página.
 *
 * `computeCoachAnalisis` ya está cubierto por `coachAnalisis.test.ts`; acá se
 * verifica cómo se arma la tarjeta a partir de esos datos.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import CoachAnalisis from '@/components/CoachAnalisis';
import { computeStats } from '@/lib/stats';
import { activity } from '@/__tests__/helpers/activity';
import { Activity } from '@/types/activity';

const NOW = new Date('2026-07-15T12:00:00Z');

function historial(n: number): Activity[] {
  return Array.from({ length: n }, (_, i) => {
    const iso = new Date(NOW.getTime() - i * 86400000).toISOString();
    return activity({ id: i + 1, distance: 8000 + i * 100, moving_time: 2400, start_date: iso, start_date_local: iso });
  });
}

function renderCard(n = 15) {
  const activities = historial(n);
  return render(<CoachAnalisis activities={activities} stats={computeStats(activities)} />);
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

it('no tiene el header fijo ni la agenda de días', () => {
  renderCard();

  expect(screen.queryByText('Análisis del Coach')).not.toBeInTheDocument();
  expect(screen.queryByText('Hoy')).not.toBeInTheDocument();
  expect(screen.queryByText('Mañana')).not.toBeInTheDocument();
});

it('las actividades viven dentro de la card, con sólo tres filtros', () => {
  renderCard();

  expect(screen.getByText('Actividades')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Más recientes' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Más largas' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Más rápidas' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Más desnivel' })).not.toBeInTheDocument();
});

it('muestra 10 actividades por defecto, con opción de ver más', () => {
  renderCard(15);

  // Las tarjetas del historial embebido son `<h4>`; la actividad principal de
  // arriba no lo es, así que este selector cuenta sólo la lista de abajo.
  expect(screen.getAllByRole('heading', { level: 4, name: 'Salida' })).toHaveLength(10);
  expect(screen.getByRole('button', { name: /Ver \d+ más/ })).toBeInTheDocument();
});
