import styled from 'styled-components';

const ORANGE_SCALE = ['#1a1f28', '#6b3f1a', '#97561d', '#c9711f', '#ff9d42'];

export const HeatmapCard = styled.div`
  background: none;
  border: none;
  border-radius: 0;
  padding: 0.2rem 0 0 0;
  overflow-x: auto;
`;

export const HeatmapViewport = styled.div`
  --cell-size: 13px;
  --cell-gap: 3px;
  --cell-step: calc(var(--cell-size) + var(--cell-gap));
  width: 100%;
  min-width: 740px;
  border-radius: 0;
  border: none;
  background: none;
  overflow: auto;
  position: relative;
`;

export const HeatmapContent = styled.div`
  display: flex;
  gap: 8px;
  min-width: fit-content;
`;

export const HeatmapDayLabels = styled.div`
  display: grid;
  grid-template-rows: repeat(7, var(--cell-size));
  gap: var(--cell-gap);
  padding-top: var(--cell-step);
`;

export const HeatmapDayLabel = styled.span`
  height: var(--cell-size);
  width: 28px;
  font-size: 0.63rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
`;

export const HeatmapBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--cell-gap);
`;

export const HeatmapMonthsRow = styled.div`
  display: flex;
  gap: var(--cell-gap);
  min-height: 14px;
`;

export const HeatmapMonthCell = styled.span`
  width: var(--cell-size);
  height: 14px;
  font-size: 0.63rem;
  color: var(--text-muted);
  text-transform: uppercase;
`;

export const HeatmapGrid = styled.div`
  display: flex;
  gap: var(--cell-gap);
`;

export const HeatmapWeekColumn = styled.div`
  display: grid;
  grid-template-rows: repeat(7, var(--cell-size));
  gap: var(--cell-gap);
`;

interface HeatmapCellProps {
  $level: number;
}

export const HeatmapCell = styled.button<HeatmapCellProps>`
  width: var(--cell-size);
  height: var(--cell-size);
  border: 0;
  border-radius: 2px;
  background: ${({ $level }) => ORANGE_SCALE[Math.max(0, Math.min($level, ORANGE_SCALE.length - 1))]};
  padding: 0;
  cursor: pointer;
  transition: filter 0.14s ease, transform 0.14s ease;

  &:hover {
    filter: brightness(1.18);
    transform: translateY(-0.5px);
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
