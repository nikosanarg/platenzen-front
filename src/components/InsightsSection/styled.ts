import styled from 'styled-components';

export const SectionRoot = styled.div`
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
`;

export const InsightList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-top: 0.75rem;
`;

export const InsightItem = styled.li`
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  padding-left: 1rem;
  position: relative;

  &::before {
    content: '·';
    position: absolute;
    left: 0;
    color: var(--text-muted);
    font-weight: 700;
  }
`;
