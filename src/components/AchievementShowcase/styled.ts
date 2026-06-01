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
  gap: 0.875rem;
`;

export const CategoryTitle = styled.h3`
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-muted);
`;

export const AchievementsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 0.625rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

/* ── Achievement card ─────────────────────────────────────────── */

export const AchCard = styled.div<{ $unlocked: boolean }>`
  position: relative;
  background: var(--bg-card);
  border: 1px solid ${({ $unlocked }) => ($unlocked ? 'var(--border-light)' : 'var(--border)')};
  border-radius: var(--radius-sm);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  opacity: ${({ $unlocked }) => ($unlocked ? 1 : 0.45)};
  transition: opacity 0.2s;
  cursor: ${({ $unlocked }) => ($unlocked ? 'default' : 'default')};

  ${({ $unlocked }) =>
    $unlocked &&
    `&::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: rgba(252, 76, 2, 0.04);
      pointer-events: none;
    }`}
`;

export const AchXP = styled.div<{ $unlocked: boolean }>`
  position: absolute;
  top: 0.625rem;
  right: 0.75rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${({ $unlocked }) => ($unlocked ? 'var(--accent)' : 'var(--text-muted)')};
`;

export const AchName = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  padding-right: 2rem;
`;

export const AchDesc = styled.div`
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.45;
`;

export const AchDate = styled.div`
  font-size: 0.68rem;
  color: var(--accent);
  font-weight: 500;
`;

/* ── Progress bar (for unlocked ones' sub-items or locked) ──── */

export const AchProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.125rem;
`;

export const AchProgressTrack = styled.div`
  flex: 1;
  height: 3px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
`;

export const AchProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => ($pct * 100).toFixed(1)}%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.5s ease;
`;

export const AchProgressText = styled.div`
  font-size: 0.65rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
`;

/* ── Upcoming achievements ─────────────────────────────────────── */

export const UpcomingBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
`;

export const UpcomingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const UpcomingRow = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.875rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.875rem;
`;

export const UpcomingInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const UpcomingName = styled.div`
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
`;

export const UpcomingProgressTrack = styled.div`
  height: 4px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
`;

export const UpcomingProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => ($pct * 100).toFixed(1)}%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.5s ease;
`;

export const UpcomingProgressText = styled.div`
  font-size: 0.7rem;
  color: var(--text-secondary);
`;

export const UpcomingPct = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 40px;
  text-align: right;
`;
