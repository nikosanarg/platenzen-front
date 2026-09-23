/**
 * El perfil de ramas en la card de la Home: radar y árbol dejaron de ser dos
 * pestañas y pasaron a ser un solo dibujo — el polígono pintado y los 18 nodos
 * del árbol conviven sobre la misma telaraña.
 *
 * Lo que se verifica acá no es qué dibuja `branchTree` —eso lo cubre
 * `branchTree.test.ts`— sino que las dos lecturas efectivamente convivan sin
 * un conmutador, y que el detalle de un nodo aparezca sólo como tooltip al
 * pasar el mouse o hacer foco, nunca como texto fijo en la card.
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
  const utils = render(<PersonajeCard activities={activities} stats={computeStats(activities)} />);
  const svg = utils.container.querySelector<HTMLElement>('svg[viewBox="0 0 300 300"]')!;
  return { ...utils, svg };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

const HINT_FIJO = /habilidades desbloqueadas/;
/** La explicación del pie del radar, en cualquiera de sus dos redacciones. */
const PIE_RADAR = /dónde quedarías si dejás de correr|Tu progreso no vence/;

it('no hay conmutador: no existen las pestañas Radar ni Árbol', () => {
  renderCard();

  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
});

it('dibuja los 18 nodos del árbol', () => {
  renderCard();

  expect(screen.getAllByRole('button', { name: /nivel [123]/ })).toHaveLength(18);
});

it('la explicación del gráfico no es texto fijo: aparece como tooltip al pasar el mouse por el área pintada', () => {
  renderCard();

  expect(screen.queryByText(PIE_RADAR)).not.toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();

  const area = screen.getByRole('img', { name: 'Cómo leer este gráfico' });
  fireEvent.mouseEnter(area);

  const tooltip = screen.getByRole('status');
  expect(within(tooltip).getByText(PIE_RADAR)).toBeInTheDocument();

  fireEvent.mouseLeave(area);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('no queda el texto fijo de "N de 18 habilidades desbloqueadas"', () => {
  renderCard();

  expect(screen.queryByText(HINT_FIJO)).not.toBeInTheDocument();
});

it('pasar el mouse por un nodo levanta su detalle en un tooltip, no antes', () => {
  renderCard();
  const nodo = screen.getAllByRole('button', { name: /nivel 1/ })[0];

  expect(screen.queryByRole('status')).not.toBeInTheDocument();

  fireEvent.mouseEnter(nodo);

  const tooltip = screen.getByRole('status');
  expect(within(tooltip).getByText(/nivel 1/)).toBeInTheDocument();

  fireEvent.mouseLeave(nodo);

  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('tocar un nodo fija el tooltip, y tocarlo de nuevo lo cierra', () => {
  renderCard();
  const nodo = screen.getAllByRole('button', { name: /nivel 1/ })[0];

  fireEvent.click(nodo);
  expect(screen.getByRole('status')).toBeInTheDocument();

  fireEvent.click(nodo);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('las seis ramas y sus porcentajes aparecen una sola vez cada uno en la telaraña', () => {
  const { svg } = renderCard();

  for (const rama of ['Resistencia', 'Fondo', 'Velocidad', 'Consistencia', 'Exploración', 'Desnivel']) {
    const etiqueta = within(svg).getByText(rama);
    expect(etiqueta.nextElementSibling?.textContent).toMatch(/^\d+%$/);
  }
});

it('la constancia (el mapa de calor) vive en la columna de identidad, sin título ni leyenda propios', () => {
  renderCard();

  expect(screen.getByRole('grid', { name: 'Mapa anual de actividad por día' })).toBeInTheDocument();
  expect(screen.queryByText('Constancia')).not.toBeInTheDocument();
});

it('sin empate entre ramas, el título es texto plano, no un desplegable', () => {
  const { container } = renderCard();

  expect(container.querySelector('[aria-haspopup="listbox"]')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
});

it('la rama dominante sale dorada en la telaraña', () => {
  const { svg } = renderCard();

  // La telaraña dibuja seis radios; el de la rama dominante lleva el trazo dorado.
  const radios = svg.querySelectorAll('line');
  const dorados = [...radios].filter(l => l.getAttribute('stroke')?.includes('--gold-rgb'));
  expect(dorados).toHaveLength(1);
});
