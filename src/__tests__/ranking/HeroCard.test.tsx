/**
 * La ficha pública dibujada. Lo que se verifica es lo que la distingue de la
 * card privada de la Home: habla de un tercero, muestra la liga por nombre,
 * el mapa de calor es de 90 días, y cada lista corta tiene su estado vacío.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import HeroCard from '@/components/HeroCard';
import { buildHeroProfile } from '@/lib/heroProfile';
import { computeStats } from '@/lib/stats';
import { activity } from '@/__tests__/helpers/activity';
import { Activity } from '@/types/activity';

const NOW = new Date(2026, 6, 15, 12, 0, 0);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

const at = (id: number, dia: string, over: Partial<Activity> = {}) =>
  activity({ id, name: `Salida ${id}`, start_date_local: `${dia}T07:00:00Z`, ...over });

function renderFicha(activities: Activity[], nombre: string | null = null) {
  const profile = buildHeroProfile(activities, computeStats(activities), NOW, nombre);
  return render(<HeroCard profile={profile} />);
}

it('muestra el nombre sólo cuando se conoce', () => {
  renderFicha([at(1, '2026-07-10')], 'Ana Pérez');
  expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
});

it('nombra la liga, no sólo la colorea', () => {
  renderFicha([at(1, '2026-07-13')]);
  expect(screen.getByText('Liga Bronce')).toBeInTheDocument();
});

it('el mapa de calor cubre los últimos 90 días', () => {
  renderFicha([at(1, '2026-07-10')]);
  expect(screen.getByRole('grid', { name: /últimos 90 días/ })).toBeInTheDocument();
});

it('las listas cortas cambian con el orden elegido', () => {
  renderFicha([
    at(1, '2026-07-10', { distance: 5000, moving_time: 1500 }),
    at(2, '2026-07-01', { distance: 21000, moving_time: 7560 }),
  ]);
  const filas = () => screen.getAllByRole('heading', { level: 4 }).map(h => h.textContent);

  expect(filas()).toEqual(['Salida 1', 'Salida 2']);
  fireEvent.click(screen.getByRole('button', { name: 'Más largas' }));
  expect(filas()).toEqual(['Salida 2', 'Salida 1']);
  expect(screen.getByRole('button', { name: 'Más largas' })).toHaveAttribute('aria-pressed', 'true');
});

it('"más rápidas" sin running dice por qué está vacía', () => {
  renderFicha([at(1, '2026-07-10', { sport_type: 'Ride', type: 'Ride' })]);
  fireEvent.click(screen.getByRole('button', { name: 'Más rápidas' }));
  expect(screen.getByText('Sin salidas de running con ritmo medido.')).toBeInTheDocument();
});

it('las frases están en tercera persona', () => {
  renderFicha([at(1, '2026-07-10', { distance: 22000, moving_time: 7200 })]);
  expect(screen.getByText('Lo que dicen sus datos')).toBeInTheDocument();
  expect(screen.getByText(/Ya alcanzó una distancia de media maratón/)).toBeInTheDocument();
});

it('sin frases no deja un título vacío', () => {
  renderFicha([]);
  expect(screen.queryByText('Lo que dicen sus datos')).not.toBeInTheDocument();
});
