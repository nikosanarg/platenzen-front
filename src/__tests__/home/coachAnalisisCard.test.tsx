/**
 * La card del coach en la Home: sin el header fijo ("Análisis del Coach") ni
 * la agenda de ayer→+72h, y con el historial de actividades embebido debajo
 * de la última salida, en vez de vivir en una sección aparte de la página.
 *
 * `computeCoachAnalisis` ya está cubierto por `coachAnalisis.test.ts`; acá se
 * verifica cómo se arma la tarjeta a partir de esos datos.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
  // El historial recuerda si estaba abierto en `localStorage`: sin limpiarlo,
  // un test contamina el estado inicial del siguiente.
  window.localStorage.clear();
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

it('el cartel de esquina marca cuándo fue la última salida', () => {
  renderCard();

  expect(screen.getByText('¡Última actividad!')).toBeInTheDocument();
  expect(screen.getByText('HOY')).toBeInTheDocument();
});

it('las actividades viven dentro de la card, con sólo tres filtros', () => {
  renderCard();

  expect(screen.getByRole('button', { name: 'Ver actividades' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Más recientes' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Más largas' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Más rápidas' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Más desnivel' })).not.toBeInTheDocument();
});

it('el historial arranca colapsado, sin la lista ni el paginador', () => {
  const { container } = renderCard(15);

  // El contenido sigue montado (así se puede animar la apertura), pero
  // `inert` lo saca de la lectura de pantalla y del tabulado mientras está
  // colapsado.
  expect(container.querySelector('[inert]')).toBeInTheDocument();
});

it('tocar "Ver actividades" abre la lista, paginada de a 10', () => {
  renderCard(15);

  fireEvent.click(screen.getByRole('button', { name: 'Ver actividades' }));

  // Las tarjetas del historial embebido son `<h4>`; la actividad principal de
  // arriba no lo es, así que este selector cuenta sólo la lista de abajo.
  expect(screen.getAllByRole('heading', { level: 4, name: 'Salida' })).toHaveLength(10);
  expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Página 2' })).toBeInTheDocument();
});

it('elegir un filtro estando colapsado abre la lista y aplica ese orden', () => {
  renderCard(15);

  fireEvent.click(screen.getByRole('button', { name: 'Más largas' }));

  expect(screen.getAllByRole('heading', { level: 4, name: 'Salida' }).length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: 'Más largas' })).toHaveAttribute('aria-pressed', 'true');
});

it('el chevron de abajo vuelve a colapsar la lista', () => {
  const { container } = renderCard(15);

  fireEvent.click(screen.getByRole('button', { name: 'Ver actividades' }));
  expect(container.querySelector('[inert]')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Colapsar actividades' }));

  expect(container.querySelector('[inert]')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ver actividades' })).toBeInTheDocument();
});

it('recuerda que estaba abierta después de desmontar y volver a montar (cambio de tab)', () => {
  const { unmount } = renderCard(15);
  fireEvent.click(screen.getByRole('button', { name: 'Ver actividades' }));
  unmount();

  renderCard(15);

  expect(screen.getAllByRole('heading', { level: 4, name: 'Salida' }).length).toBeGreaterThan(0);
  expect(screen.queryByRole('button', { name: 'Ver actividades' })).not.toBeInTheDocument();
});
