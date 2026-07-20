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
  background: #08080a;
  border-radius: var(--radius);
  box-shadow: 0 0 8px rgba(163, 230, 53, 0.12);
  padding: 1.25rem 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 0 8px rgba(163, 230, 53, 0.22);
  }
`;

export const StravaBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.72rem;
  font-weight: 500;
  color: #fc4c02;
  border: 1px solid rgba(252, 76, 2, 0.3);
  border-radius: 6px;
  padding: 0.3rem 0.625rem;
  transition: background 0.15s;
  text-decoration: none;
  align-self: flex-start;
  margin-top: 0.75rem;

  &:hover {
    background: rgba(252, 76, 2, 0.1);
  }
`;

export const DistanceLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #4ade80;
`;

export const TimeRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

export const CurrentTime = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.1;
`;

export const PaceSmall = styled.span`
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
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
  margin-top: auto;
  padding-top: 0.5rem;
`;

export const NoRecord = styled.div`
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 0.5rem;
`;
