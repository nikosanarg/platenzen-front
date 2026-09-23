import styled from 'styled-components';

/**
 * Verde (poco activo) a naranja (muy activo), negro para las celdas en cero
 * — a propósito distinta de la escala mono-naranja del heatmap anual: acá
 * "cero" tiene que leerse como ausencia, no como el extremo bajo de la escala.
 */
const SCALE = ['#14171d', '#2f8f57', '#8bab3c', '#d9a53b', '#ff9d42'];

export const Root = styled.div`
  --hours: 24;
  --cell-gap: 3px;
  --min-cell-size: 14px;
  width: 100%;
  min-width: 0;
  position: relative;
  container-type: inline-size;

  @container (max-width: 420px) {
    --cell-gap: 2px;
    --min-cell-size: 10px;
  }
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
  background: ${({ $level }) => SCALE[Math.max(0, Math.min($level, SCALE.length - 1))]};
  padding: 0;
  cursor: pointer;
  transition: filter 0.14s ease, transform 0.14s ease;

  &:hover {
    filter: brightness(1.2);
    transform: translateY(-0.5px);
  }

  &:focus-visible {
    outline: 1px solid ${SCALE[SCALE.length - 1]};
    outline-offset: 1px;
  }
`;

export const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.6rem;
  font-size: 0.62rem;
  color: var(--text-muted);
`;

export const LegendSwatch = styled.span<{ $level: number }>`
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: ${({ $level }) => SCALE[Math.max(0, Math.min($level, SCALE.length - 1))]};
`;
