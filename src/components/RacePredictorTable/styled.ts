import styled from 'styled-components';

export const PredictorRoot = styled.section``;

/* ── Same shell as CompareTable ──────────────────────────────── */

export const PredictorTable = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
`;

const GRID = '1.2fr 1fr 1fr';
const GRID_SM = '1.2fr 1fr 1fr';

export const PredictorHeader = styled.div`
  display: grid;
  grid-template-columns: ${GRID};
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);

  @media (max-width: 500px) {
    grid-template-columns: ${GRID_SM};
    padding: 0.625rem 0.875rem;
  }
`;

export const ColHead = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);

  &:not(:first-child) {
    text-align: right;
  }
`;

export const PredictorRow = styled.div`
  display: grid;
  grid-template-columns: ${GRID};
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--border);
  align-items: start;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 500px) {
    grid-template-columns: ${GRID_SM};
    padding: 0.75rem 0.875rem;
  }
`;

export const DistanceLabel = styled.div`
  font-size: 0.82rem;
  color: var(--text-secondary);
`;

export const TimeCell = styled.div`
  text-align: right;
`;

export const TimeValue = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
`;

export const TimeDate = styled.div`
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 0.125rem;
`;

export const EmptyTime = styled.div`
  font-size: 0.82rem;
  color: var(--text-muted);
  text-align: right;
`;

export const PredictedValue = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

/* ── Same ConclusionBox as PeriodComparator ──────────────────── */

export const PredictorNote = styled.div`
  margin-top: 1.25rem;
  padding: 1rem 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-left: 3px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 0.835rem;
  color: var(--text-secondary);
  line-height: 1.65;
`;
