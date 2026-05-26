import styled from 'styled-components';

export const SectionRoot = styled.section``;

export const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
`;

export const InsightList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const InsightItem = styled.li`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-sm);
  padding: 0.875rem 1rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
`;
