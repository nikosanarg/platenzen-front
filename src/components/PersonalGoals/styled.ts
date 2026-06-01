import styled from 'styled-components';

export const GoalsRoot = styled.section``;

export const GoalsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const GoalCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.125rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

export const GoalLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
`;

export const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.875rem;
`;

export const ProgressTrack = styled.div`
  flex: 1;
  height: 5px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => ($pct * 100).toFixed(1)}%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.6s ease;
`;

export const ProgressPct = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent);
  min-width: 2.5rem;
  text-align: right;
`;

export const GoalDetail = styled.div`
  font-size: 0.72rem;
  color: var(--text-muted);
`;
