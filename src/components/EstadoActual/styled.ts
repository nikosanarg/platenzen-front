import styled from 'styled-components';

export const EstadoRoot = styled.section``;

export const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

export const ObsCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
  padding: 0.875rem 1rem;
`;

export const ObsText = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
`;
