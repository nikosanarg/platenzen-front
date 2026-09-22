import styled from 'styled-components';

export const HistoryRoot = styled.section``;

/** Una lista, no una grilla: vive en la sidebar de "cómo viene mi historia". */
export const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const DistanceRow = styled.a`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  background: var(--bg-card);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0.7rem 0.85rem;
  text-decoration: none;
  transition: border-color 0.15s;

  &:hover {
    border-color: rgba(var(--accent-rgb), 0.35);
  }
`;

export const RowHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
`;

/** +6px sobre el resto de la card: es lo primero que se lee de la fila. */
export const DistanceLabel = styled.span`
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--positive);
`;

export const RowTime = styled.span`
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
`;

export const RowMeta = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.68rem;
  color: var(--text-muted);
`;

export const ImprovementText = styled.span`
  color: var(--positive);
  font-weight: 600;
`;

export const NoRecord = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.78rem;
  color: var(--text-muted);
  font-style: italic;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  padding: 0.7rem 0.85rem;
`;
