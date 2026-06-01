import styled from 'styled-components';

export const ComparatorRoot = styled.section``;

export const TabsRow = styled.div`
  display: flex;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: 1.5rem;
  width: fit-content;
`;

export const TabBtn = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? 'var(--accent)' : 'var(--bg-card)')};
  color: ${({ $active }) => ($active ? '#fff' : 'var(--text-secondary)')};
  border: none;
  padding: 0.5rem 1.25rem;
  font-size: 0.82rem;
  font-weight: ${({ $active }) => ($active ? '700' : '400')};
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--accent-hover)' : 'var(--bg-card-hover)')};
    color: ${({ $active }) => ($active ? '#fff' : 'var(--text-primary)')};
  }
`;

/* ── Shared table shell ───────────────────────────────────────── */

export const CompareTable = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
`;

const GRID = '1.2fr 2fr 72px';
const GRID_SM = '1.2fr 2fr 60px';

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: ${GRID};
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);

  @media (max-width: 600px) {
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
`;

export const TableRow = styled.div`
  display: grid;
  grid-template-columns: ${GRID};
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--border);
  align-items: center;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 600px) {
    grid-template-columns: ${GRID_SM};
    padding: 0.75rem 0.875rem;
  }
`;

export const MetricName = styled.div`
  font-size: 0.82rem;
  color: var(--text-secondary);
`;

/* ── "Antes vs. Ahora" combined cell ────────────────────────────  */

export const CombinedCell = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
`;

export const BeforeValue = styled.span<{ $positive: boolean | null }>`
  font-weight: 500;
  color: ${({ $positive }) =>
    $positive === null
      ? 'var(--text-muted)'
      : $positive
      ? 'rgba(74, 222, 128, 0.5)'
      : 'rgba(245, 158, 11, 0.5)'};
`;

export const VsText = styled.span`
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-weight: 400;
`;

export const AfterValue = styled.span<{ $positive: boolean | null }>`
  font-weight: 700;
  color: ${({ $positive }) =>
    $positive === null
      ? 'var(--text-primary)'
      : $positive
      ? '#4ade80'
      : '#f59e0b'};
`;

export const DeltaBadge = styled.div<{ $positive: boolean | null }>`
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ $positive }) =>
    $positive === null ? 'var(--text-muted)' : $positive ? '#4ade80' : '#f59e0b'};
  text-align: right;
`;

export const ConclusionBox = styled.div`
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
