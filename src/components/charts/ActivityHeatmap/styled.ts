import styled from 'styled-components';

export const HeatmapCard = styled.div`
  background: none;
  border: none;
  border-radius: 0;
  padding: 1.25rem 0 0 0;
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

export const HeatmapViewport = styled.div`
  width: 100%;
  height: 240px;
  min-width: 720px;
  border-radius: 0;
  border: none;
  background: none;
  overflow: visible;

  @media (max-width: 900px) {
    min-width: 620px;
    height: 215px;
  }

  @media (max-width: 600px) {
    min-width: 520px;
    height: 185px;
  }
`;
export const MonthLabels = styled.div`
  position: relative;
  width: 100%;
  height: 0;
  z-index: 2;
  pointer-events: none;
`;

export const MonthLabel = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 500;
  letter-spacing: 0.04em;
  background: rgba(10, 16, 24, 0.85);
  padding: 1px 6px 1px 2px;
  border-radius: 4px;
  user-select: none;
  transform: translateY(-18px);
`;

export const HeatmapLoading = styled.div`
  display: grid;
  place-items: center;
  height: 100%;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
`;

export const HeatmapLegend = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
`;

export const LegendItems = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
`;

export const LegendItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

export const LegendLabel = styled.span`
  font-size: 0.7rem;
  color: var(--text-muted);
`;

export const LegendSwatch = styled.span<{ $active?: boolean }>`
  width: 11px;
  height: 11px;
  border-radius: 2px;
  background: ${({ $active }) => ($active ? 'var(--accent)' : '#556072')};
`;

export const LegendHint = styled.span`
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
`;

export const ConsistencyRow = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  border-top: 1px solid var(--border);
  padding-top: 0.875rem;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    gap: 1rem;
  }
`;

export const ConsistencyStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

export const ConsistencyValue = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1;
`;

export const ConsistencyLabel = styled.div`
  font-size: 0.65rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
`;
