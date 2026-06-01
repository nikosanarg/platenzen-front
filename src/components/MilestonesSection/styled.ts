import styled from 'styled-components';

export const MilestonesRoot = styled.section``;

export const MilestonesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

export const MilestoneRow = styled.div<{ $unlocked: boolean }>`
  background: var(--bg-card);
  border: 1px solid ${({ $unlocked }) => ($unlocked ? 'var(--accent)' : 'var(--border)')};
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;

  ${({ $unlocked }) =>
    $unlocked &&
    `
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--accent);
      opacity: 0.04;
      pointer-events: none;
    }
  `}
`;

export const MilestoneTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const MilestoneIcon = styled.div<{ $unlocked: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ $unlocked }) => ($unlocked ? 'var(--accent)' : 'var(--border)')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
`;

export const MilestoneInfo = styled.div`
  flex: 1;
`;

export const MilestoneLabel = styled.div<{ $unlocked: boolean }>`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ $unlocked }) => ($unlocked ? 'var(--text-primary)' : 'var(--text-secondary)')};
`;

export const MilestoneDate = styled.div`
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 0.125rem;
`;

export const XpBadge = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-muted);
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  white-space: nowrap;
`;

export const MilestoneProgressBar = styled.div`
  height: 4px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
`;

export const MilestoneProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => ($pct * 100).toFixed(1)}%;
  background: var(--accent);
  border-radius: 999px;
`;

export const MilestoneProgressLabel = styled.div`
  font-size: 0.68rem;
  color: var(--text-muted);
`;

export const SectionDivider = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0.25rem 0;
  margin-top: 0.5rem;
`;
