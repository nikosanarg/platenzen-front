import styled from 'styled-components';

export const ShowcaseRoot = styled.section`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
`;

/* ── Category ─────────────────────────────────────────────────── */

export const CategoryBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const CategoryTitle = styled.h3`
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-muted);
`;

/* ── Stepper row ──────────────────────────────────────────────── */

export const StepperRow = styled.div`
  display: flex;
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: 0.5rem;

  &::-webkit-scrollbar {
    height: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-light);
    border-radius: 999px;
  }
`;

/*
 * Horizontal line segment between two cards.
 * margin-top aligns the line center with the center of the StepDot:
 *   card padding-top (0.875rem) + dot radius (5px) − line half-height (1px)
 */
export const StepLine = styled.div<{ $active: boolean }>`
  height: 2px;
  min-width: 20px;
  flex: 0 0 20px;
  margin-top: calc(0.875rem + 4px);
  background: ${({ $active }) => ($active ? '#4ade80' : 'var(--border)')};
  flex-shrink: 0;
  transition: background 0.3s;
`;

/* ── Step card ────────────────────────────────────────────────── */

export const StepCard = styled.div<{ $unlocked: boolean; $isCurrent: boolean }>`
  min-width: 148px;
  max-width: 180px;
  flex: 1;
  background: var(--bg-card);
  border: 1px solid
    ${({ $unlocked, $isCurrent }) =>
      $unlocked
        ? 'rgba(74, 222, 128, 0.3)'
        : $isCurrent
        ? 'var(--border-light)'
        : 'var(--border)'};
  border-radius: var(--radius-sm);
  padding: 0.875rem 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  opacity: ${({ $unlocked, $isCurrent }) => ($unlocked || $isCurrent ? 1 : 0.35)};
  position: relative;
  transition: opacity 0.2s;
`;

/* Circle marker — always the first child so its Y is predictable */
export const StepDot = styled.div<{ $unlocked: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $unlocked }) => ($unlocked ? '#4ade80' : 'var(--border)')};
  margin-bottom: 0.5rem;
`;

export const StepXP = styled.div<{ $unlocked: boolean }>`
  position: absolute;
  top: 0.55rem;
  right: 0.625rem;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${({ $unlocked }) => ($unlocked ? '#4ade80' : 'var(--text-muted)')};
`;

export const StepName = styled.div`
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  padding-right: 2.5rem;
`;

export const StepDate = styled.div`
  font-size: 0.68rem;
  color: #4ade80;
  font-weight: 500;
  margin-top: 0.25rem;
`;

export const StepProgressTrack = styled.div`
  height: 3px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 0.375rem;
`;

export const StepProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => ($pct * 100).toFixed(1)}%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.5s ease;
`;

export const StepProgressText = styled.div`
  font-size: 0.65rem;
  color: var(--text-secondary);
  margin-top: 0.125rem;
`;
