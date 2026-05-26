import styled from 'styled-components';

export const HeatmapCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
  overflow-x: auto;
`;

export const HeatmapTitle = styled.h3`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 1rem;
`;

export const HeatmapGrid = styled.div`
  display: flex;
  gap: 3px;
`;

export const HeatmapCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

export const HeatmapCell = styled.div<{ $level: number }>`
  width: 11px;
  height: 11px;
  border-radius: 2px;
  background: ${({ $level }) => {
    if ($level === 0) return 'var(--bg-secondary)';
    if ($level === 1) return 'rgba(252, 76, 2, 0.25)';
    if ($level === 2) return 'rgba(252, 76, 2, 0.5)';
    if ($level === 3) return 'rgba(252, 76, 2, 0.75)';
    return 'var(--accent)';
  }};
  cursor: default;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.8;
  }
`;

export const HeatmapLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 0.75rem;
  justify-content: flex-end;
`;

export const LegendLabel = styled.span`
  font-size: 0.7rem;
  color: var(--text-muted);
`;
