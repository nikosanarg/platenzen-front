import styled from 'styled-components';

export const ChartCard = styled.div<{ $bare?: boolean }>`
  ${({ $bare }) => !$bare && `
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.25rem;
  `}
  display: flex;
  flex-direction: column;
`;

export const ChartTitle = styled.h3`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 1rem;
`;

export const ChartArea = styled.div`
  flex: 1;
  min-height: 155px;
`;
