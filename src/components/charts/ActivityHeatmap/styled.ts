import styled from 'styled-components';

const ORANGE_SCALE = ['#1a1f28', '#6b3f1a', '#97561d', '#c9711f', '#ff9d42'];

export const HeatmapCard = styled.div`
  background: none;
  border: none;
  border-radius: 0;
  padding: 0.2rem 0 0 0;
  width: 100%;
  overflow: hidden;
`;

export const HeatmapViewport = styled.div`
  --weeks: 53;
  --month-row-height: 14px;
  --cell-gap: 3px;
  --min-cell-size: 11px;
  width: 100%;
  min-width: 0;
  border-radius: 0;
  border: none;
  background: none;
  overflow: hidden;
  position: relative;

  @media (max-width: 700px) {
    --cell-gap: 2px;
    --min-cell-size: 7px;
  }

  @media (max-width: 480px) {
    --cell-gap: 1px;
    --min-cell-size: 5px;
  }
`;

export const HeatmapContent = styled.div`
  width: 100%;
  min-width: 0;
`;

export const HeatmapBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--cell-gap);
  width: 100%;
`;

export const HeatmapMonthsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(var(--weeks), minmax(0, 1fr));
  gap: var(--cell-gap);
  min-height: var(--month-row-height);
  width: 100%;
  overflow: hidden;
`;

export const HeatmapMonthCell = styled.span`
  width: 100%;
  height: var(--month-row-height);
  font-size: 0.63rem;
  color: var(--text-muted);
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
`;

export const HeatmapGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(var(--weeks), minmax(0, 1fr));
  gap: var(--cell-gap);
  width: 100%;
`;

export const HeatmapWeekColumn = styled.div`
  display: grid;
  grid-template-rows: repeat(7, minmax(var(--min-cell-size), 1fr));
  gap: var(--cell-gap);
`;

interface HeatmapCellProps {
  $level: number;
  $future?: boolean;
}

export const HeatmapCell = styled.button<HeatmapCellProps>`
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 0;
  border-radius: 2px;
  background: ${({ $level, $future }) => ($future ? 'transparent' : ORANGE_SCALE[Math.max(0, Math.min($level, ORANGE_SCALE.length - 1))])};
  padding: 0;
  cursor: ${({ $future }) => ($future ? 'default' : 'pointer')};
  transition: filter 0.14s ease, transform 0.14s ease;
  pointer-events: ${({ $future }) => ($future ? 'none' : 'auto')};

  &:hover {
    filter: ${({ $future }) => ($future ? 'none' : 'brightness(1.18)')};
    transform: ${({ $future }) => ($future ? 'none' : 'translateY(-0.5px)')};
  }

  &:focus-visible {
    outline: 1px solid #ff9c42;
    outline-offset: 1px;
  }
`;

export const HeatmapTooltip = styled.div`
  position: absolute;
  background: rgba(20, 22, 28, 0.98);
  color: #fff;
  font-size: 0.82rem;
  border-radius: 6px;
  padding: 6px 12px;
  pointer-events: none;
  box-shadow: 0 2px 12px 0 #0008;
  z-index: 10;
  white-space: nowrap;
  border: 1px solid #222;
`;
