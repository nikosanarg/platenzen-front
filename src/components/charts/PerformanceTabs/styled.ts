import styled from 'styled-components';

export const TabsRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

export const TabBar = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 0.75rem;
`;

export const TabBtn = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  border-bottom: 2px solid ${({ $active }) => ($active ? 'var(--accent)' : 'transparent')};
  padding: 0.5rem 0.875rem;
  font-size: 0.8rem;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  color: ${({ $active }) => ($active ? 'var(--text-primary)' : 'var(--text-muted)')};
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
  margin-bottom: -1px;

  &:hover {
    color: var(--text-secondary);
  }
`;

export const TabPanel = styled.div``;
