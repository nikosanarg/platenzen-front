import styled from 'styled-components';

export const PredictionsRoot = styled.section``;

export const PredictionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.875rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const PredictionCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const PredictionLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
`;

export const PredictionValue = styled.div`
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.2;
`;

export const PredictionDetail = styled.div`
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.125rem;
`;

export const PredictionEquiv = styled.div`
  font-size: 0.68rem;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 0.125rem;
`;
