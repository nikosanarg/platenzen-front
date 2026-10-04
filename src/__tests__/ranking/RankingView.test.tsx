/**
 * La tabla del ranking: una sección por liga, el orden elegido aplicado dentro
 * de cada una, y la ficha del corredor en un modal.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import RankingView from '@/components/RankingView';
import { RankingEntry } from '@/lib/ranking';
import { buildHeroProfile } from '@/lib/heroProfile';
import { computeStats } from '@/lib/stats';

const entry = (over: Partial<RankingEntry> & { id: string }): RankingEntry => ({
  nombre: over.id,
  rachaSemanas: 0,
  liga: 'bronce',
  distanciaKm: 0,
  actividades: 0,
  ritmoSegKm: null,
  ...over,
});

const ENTRIES = [
  entry({ id: 'Ana', liga: 'oro', rachaSemanas: 15, distanciaKm: 300, actividades: 30, ritmoSegKm: 340 }),
  entry({ id: 'Beto', liga: 'oro', rachaSemanas: 20, distanciaKm: 250, actividades: 40, ritmoSegKm: 300 }),
  entry({ id: 'Caro', liga: 'bronce', rachaSemanas: 1, distanciaKm: 20, actividades: 3, ritmoSegKm: 360 }),
];

const seccion = (nombre: string) => screen.getByRole('region', { name: new RegExp(nombre) });
const nombresEn = (nombre: string) =>
  within(seccion(nombre)).getAllByRole('row').slice(1).map(r => within(r).getAllByRole('cell')[1].textContent);

it('agrupa por liga y avisa cuando una liga no tiene a nadie', () => {
  render(<RankingView entries={ENTRIES} fichaDe={() => undefined} />);
  expect(nombresEn('Liga Oro')).toEqual(['Ana', 'Beto']);
  expect(nombresEn('Liga Bronce')).toEqual(['Caro']);
  expect(within(seccion('Liga Plata')).getByText('Nadie en esta liga todavía.')).toBeInTheDocument();
});

it('ordena por distancia por defecto y cambia con el orden elegido', () => {
  render(<RankingView entries={ENTRIES} fichaDe={() => undefined} />);
  expect(screen.getByRole('button', { name: 'Distancia' })).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(screen.getByRole('button', { name: 'Ritmo' }));
  expect(nombresEn('Liga Oro')).toEqual(['Beto', 'Ana']);

  fireEvent.click(screen.getByRole('button', { name: 'Actividades' }));
  expect(nombresEn('Liga Oro')).toEqual(['Beto', 'Ana']);
});

it('con sólo la fila propia lo dice, y la nombra "Vos"', () => {
  render(
    <RankingView
      entries={[entry({ id: 'yo', nombre: null })]}
      propioId="yo"
      fichaDe={() => undefined}
    />,
  );
  expect(screen.getByRole('status')).toHaveTextContent('por ahora la tabla muestra sólo la tuya');
  expect(nombresEn('Liga Bronce')).toEqual(['Vos']);
});

it('una fila con ficha la abre en un modal', () => {
  const ficha = buildHeroProfile([], computeStats([]), new Date(2026, 6, 15), 'Ana');
  render(<RankingView entries={ENTRIES} fichaDe={id => (id === 'Ana' ? ficha : undefined)} />);

  expect(screen.queryByRole('button', { name: 'Ver la ficha de Beto' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Ver la ficha de Ana' }));

  const dialog = screen.getByRole('dialog', { name: 'Ficha del corredor' });
  expect(within(dialog).getByText('Corredor')).toBeInTheDocument();

  fireEvent.click(within(dialog).getByRole('button', { name: 'Cerrar' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
