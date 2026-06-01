import styled from 'styled-components';

export const ConsistencyRoot = styled.section``;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.875rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const StatCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.125rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const StatValue = styled.div`
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.2;
`;

export const StatLabel = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-muted);
`;

export const StatSub = styled.div`
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-top: 0.125rem;
`;
