import styled from 'styled-components';

export const HistoryRoot = styled.section``;

export const HistoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.875rem;

  @media (max-width: 700px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const DistanceCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem 1rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

export const DistanceLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
`;

export const CurrentTime = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.1;
`;

export const ImprovementBadge = styled.div<{ $isFirst?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #4ade80;
  margin-top: 0.125rem;
`;

export const RecordDate = styled.div`
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
`;

export const NoRecord = styled.div`
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 0.5rem;
`;
