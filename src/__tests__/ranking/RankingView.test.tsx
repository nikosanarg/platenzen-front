/**
 * La tabla del ranking: una sección por liga, el orden elegido aplicado dentro
 * de cada una, la fila propia marcada, y la ficha del corredor en un modal que
 * se carga al abrirlo.
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

const sinFicha = async () => null;

const seccion = (nombre: string) => screen.getByRole('region', { name: new RegExp(nombre) });
const nombresEn = (nombre: string) =>
  within(seccion(nombre)).getAllByRole('row').slice(1).map(r => within(r).getAllByRole('cell')[1].textContent);

it('agrupa por liga y avisa cuando una liga no tiene a nadie', () => {
  render(<RankingView entries={ENTRIES} cargarFicha={sinFicha} />);
  expect(nombresEn('Liga Oro')).toEqual(['Ana', 'Beto']);
  expect(nombresEn('Liga Bronce')).toEqual(['Caro']);
  expect(within(seccion('Liga Plata')).getByText('Nadie en esta liga todavía.')).toBeInTheDocument();
});

it('mientras no hay tabla no dice que las ligas están vacías', () => {
  render(<RankingView entries={null} cargarFicha={sinFicha} aviso={<p>Cargando el ranking…</p>} />);
  expect(screen.getByText('Cargando el ranking…')).toBeInTheDocument();
  expect(screen.queryByText('Nadie en esta liga todavía.')).not.toBeInTheDocument();
});

it('ordena por distancia por defecto y cambia con el orden elegido', () => {
  render(<RankingView entries={ENTRIES} cargarFicha={sinFicha} />);
  expect(screen.getByRole('button', { name: 'Distancia' })).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(screen.getByRole('button', { name: 'Ritmo' }));
  expect(nombresEn('Liga Oro')).toEqual(['Beto', 'Ana']);

  fireEvent.click(screen.getByRole('button', { name: 'Actividades' }));
  expect(nombresEn('Liga Oro')).toEqual(['Beto', 'Ana']);
});

it('marca la fila propia con texto, no sólo con color', () => {
  render(<RankingView entries={[entry({ id: 'yo', nombre: 'pepino357619', esPropio: true })]} cargarFicha={sinFicha} />);
  expect(nombresEn('Liga Bronce')).toEqual(['pepino357619 (vos)']);
});

it('una fila propia sin nombre se nombra "Vos"', () => {
  render(<RankingView entries={[entry({ id: 'local', nombre: null, esPropio: true })]} cargarFicha={sinFicha} />);
  expect(nombresEn('Liga Bronce')).toEqual(['Vos']);
});

it('muestra el país con su nombre accesible', () => {
  render(<RankingView entries={[entry({ id: 'Ana', pais: 'AR' })]} cargarFicha={sinFicha} />);
  expect(screen.getByRole('img', { name: 'Argentina' })).toBeInTheDocument();
});

it('quien eligió "sólo ranking" aparece sin ficha para abrir', () => {
  render(<RankingView entries={[entry({ id: 'Ana', fichaVisible: false })]} cargarFicha={sinFicha} />);
  expect(screen.queryByRole('button', { name: /Ver la ficha/ })).not.toBeInTheDocument();
});

it('la ficha se carga al abrirla y se muestra en un modal', async () => {
  const profile = buildHeroProfile([], computeStats([]), new Date(2026, 6, 15), 'Ana');
  const cargarFicha = jest.fn(async () => ({ profile, pais: null, publicadaAt: '2026-07-14T10:00:00Z', enlace: 'ana' }));
  render(<RankingView entries={ENTRIES} cargarFicha={cargarFicha} />);

  fireEvent.click(screen.getByRole('button', { name: 'Ver la ficha de Ana' }));
  const dialog = screen.getByRole('dialog', { name: 'Ficha del corredor' });
  expect(within(dialog).getByText('Cargando la ficha…')).toBeInTheDocument();

  expect(await within(dialog).findByText('Corredor')).toBeInTheDocument();
  expect(within(dialog).getByText(/Actualizada el/)).toBeInTheDocument();
  expect(within(dialog).getByRole('link', { name: 'platenzen.com/hero/ana' })).toHaveAttribute('href', '/hero/ana');
  expect(cargarFicha).toHaveBeenCalledWith('Ana');

  fireEvent.click(within(dialog).getByRole('button', { name: 'Cerrar' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('una ficha que ya no está se dice, no deja el modal colgado', async () => {
  render(<RankingView entries={ENTRIES} cargarFicha={sinFicha} />);
  fireEvent.click(screen.getByRole('button', { name: 'Ver la ficha de Caro' }));
  expect(await screen.findByText('Esta ficha no está disponible.')).toBeInTheDocument();
});
