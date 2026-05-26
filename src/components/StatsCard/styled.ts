import styled from 'styled-components';

export const CardRoot = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--border-light);
  }
`;

export const CardLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

export const CardValue = styled.span`
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
  letter-spacing: -0.02em;
`;

export const CardSub = styled.span`
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.125rem;
`;

export const CardIcon = styled.div`
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
`;
