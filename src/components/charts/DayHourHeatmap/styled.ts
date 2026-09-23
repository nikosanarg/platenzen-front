import styled from 'styled-components';

/**
 * Los 11 tonos de `--heat-0`..`--heat-100` (globals.css), indexados por
 * nivel (0 a 10). El nivel 0 es "sin actividad" — gris, no negro: acá el
 * cero es un extremo real de la escala, no una ausencia que se recorta.
 */
export const HEAT_SCALE = [
  'var(--heat-0)',
  'var(--heat-10)',
  'var(--heat-20)',
  'var(--heat-30)',
  'var(--heat-40)',
  'var(--heat-50)',
  'var(--heat-60)',
  'var(--heat-70)',
  'var(--heat-80)',
  'var(--heat-90)',
  'var(--heat-100)',
];

export function heatColor(level: number): string {
  return HEAT_SCALE[Math.max(0, Math.min(level, HEAT_SCALE.length - 1))];
}

/**
 * `height: 100%` + centrado vertical: cuando comparte row con la tarjeta de
 * "Distancia/Ritmo" (más alta, por su alto fijo en px), la grilla —más baja
 * por naturaleza— no queda pegada arriba con un hueco muerto abajo.
 */
export const Root = styled.div`
  --hours: 24;
  --cell-gap: 3px;
  --min-cell-size: 14px;
  width: 100%;
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  container-type: inline-size;

  @container (max-width: 420px) {
    --cell-gap: 2px;
    --min-cell-size: 10px;
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-bottom: 1rem;
`;

export const HeadingText = styled.h3`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

export const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
`;

export const LegendLabel = styled.span`
  font-size: 0.66rem;
  color: var(--text-muted);
  white-space: nowrap;
`;

export const LegendCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

export const LegendSwatches = styled.div`
  display: flex;
  gap: 2px;
`;

export const LegendSwatch = styled.span<{ $level: number }>`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: ${({ $level }) => heatColor($level)};
`;

export const LegendScaleLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  color: var(--text-muted);
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(26px, max-content) repeat(var(--hours), minmax(var(--min-cell-size), 1fr));
  gap: var(--cell-gap);
  width: 100%;
`;

export const Corner = styled.div``;

export const HourLabel = styled.div`
  font-size: 0.6rem;
  color: var(--text-muted);
  text-align: center;
  white-space: nowrap;
`;

export const DayLabel = styled.div`
  font-size: 0.66rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
`;

interface CellProps {
  $level: number;
}

export const Cell = styled.button<CellProps>`
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 0;
  border-radius: 2px;
  background: ${({ $level }) => heatColor($level)};
  padding: 0;
  cursor: pointer;
  transition: filter 0.14s ease, transform 0.14s ease;

  &:hover {
    filter: brightness(1.2);
    transform: translateY(-0.5px);
  }

  &:focus-visible {
    outline: 1px solid var(--heat-100);
    outline-offset: 1px;
  }
`;
