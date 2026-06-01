import styled from 'styled-components';
import { FormState } from '@/lib/formShape';

export const FormaRoot = styled.section``;

export const FormaCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  @media (max-width: 600px) {
    padding: 1.25rem 1rem;
  }
`;

export const FormaHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

export const StateBadge = styled.div<{ $state: FormState }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: ${({ $state }) =>
    $state === 'ascenso'
      ? 'rgba(34, 197, 94, 0.12)'
      : $state === 'descenso'
      ? 'rgba(245, 158, 11, 0.12)'
      : 'rgba(144, 144, 168, 0.1)'};
  color: ${({ $state }) =>
    $state === 'ascenso' ? '#4ade80' : $state === 'descenso' ? '#f59e0b' : 'var(--text-secondary)'};
  border: 1px solid
    ${({ $state }) =>
      $state === 'ascenso'
        ? 'rgba(34, 197, 94, 0.25)'
        : $state === 'descenso'
        ? 'rgba(245, 158, 11, 0.25)'
        : 'var(--border)'};
`;

export const FormaAvg = styled.div`
  font-size: 0.825rem;
  color: var(--text-muted);

  strong {
    color: var(--text-primary);
    font-weight: 600;
  }
`;

export const StatsRow = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

export const StatPill = styled.div<{ $positive?: boolean; $negative?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

export const PillValue = styled.div<{ $positive?: boolean; $negative?: boolean }>`
  font-size: 1rem;
  font-weight: 700;
  color: ${({ $positive, $negative }) =>
    $positive ? '#4ade80' : $negative ? '#f59e0b' : 'var(--text-secondary)'};
`;

export const PillLabel = styled.div`
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--border);
  margin: 0;
`;

export const ChartSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

export const ChartLabel = styled.div`
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);
`;

export const ChartWrap = styled.div`
  height: 120px;
`;

export const SharpIncreaseNote = styled.div`
  font-size: 0.75rem;
  color: var(--warning);
  padding: 0.5rem 0.75rem;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-sm);
`;
