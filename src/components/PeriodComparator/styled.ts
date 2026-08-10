import styled from 'styled-components';
import { Panel } from '@/components/Panel';

export const ComparatorRoot = styled(Panel)`
  padding: 1.75rem 1.5rem;

  @media (max-width: 600px) {
    padding: 1.25rem 1rem;
  }
`;

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
  color: ${({ $active }) => ($active ? 'var(--text-on-accent)' : 'var(--text-secondary)')};
  border: none;
  padding: 0.5rem 1.25rem;
  font-size: 0.82rem;
  font-weight: ${({ $active }) => ($active ? '700' : '400')};
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--accent-hover)' : 'var(--bg-card-hover)')};
    color: ${({ $active }) => ($active ? 'var(--text-on-accent)' : 'var(--text-primary)')};
  }
`;

/* ── Table region: full-bleed within the card's own padding ─────── */

export const CompareTable = styled.div`
  margin: 1rem -1.5rem 0;
  border-top: 1px solid var(--border);

  @media (max-width: 600px) {
    margin: 1rem -1rem 0;
  }
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
      ? 'rgba(var(--positive-rgb), 0.5)'
      : 'rgba(var(--warning-rgb), 0.5)'};
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
      ? 'var(--positive)'
      : 'var(--warning)'};
`;

export const DeltaBadge = styled.div<{ $positive: boolean | null }>`
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ $positive }) =>
    $positive === null ? 'var(--text-muted)' : $positive ? 'var(--positive)' : 'var(--warning)'};
  text-align: right;
`;

export const ConclusionBox = styled.div`
  margin-top: 1.25rem;
  padding: 1rem 1.25rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-left: 3px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 0.835rem;
  color: var(--text-secondary);
  line-height: 1.65;
`;
