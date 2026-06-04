import styled from 'styled-components';

export const Card = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (max-width: 600px) {
    padding: 1.75rem 1.25rem;
    gap: 1.5rem;
  }
`;

/* ── Level / identity header ─────────────────────────────────── */

export const LevelSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const RoleHeading = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
  flex-wrap: wrap;
`;

export const RoleNamePrimary = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: 1.1;

  @media (max-width: 600px) {
    font-size: 1.5rem;
  }
`;

export const LevelBadge = styled.span`
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.03em;
`;

export const StreakBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-muted);
  border: 1px solid rgba(252, 76, 2, 0.25);
  border-radius: 999px;
  padding: 0.1rem 0.6rem;
`;

export const XpRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
`;

export const XpTrack = styled.div`
  flex: 1;
  height: 6px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
`;

export const XpFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => ($pct * 100).toFixed(1)}%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.8s ease;
`;

export const XpLabel = styled.div`
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
`;

export const XpEventsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding-top: 0.25rem;
`;

export const XpEventRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  font-size: 0.73rem;
  line-height: 1.4;
`;

export const XpEventAmt = styled.span<{ $type: 'level' | 'role' }>`
  font-weight: 700;
  white-space: nowrap;
  color: ${({ $type }) => $type === 'level' ? 'var(--accent)' : '#f5c518'};
`;

export const XpEventLabel = styled.span`
  color: var(--text-secondary);
`;

/* ── Primary afinidad bar (below XP bar) ─────────────────────── */

export const AfinRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
`;

export const AfinTrack = styled.div`
  flex: 1;
  height: 3px;
  background: rgba(184,134,11,0.18);
  border-radius: 999px;
  overflow: hidden;
`;

export const AfinFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: #f5c518;
  border-radius: 999px;
  transition: width 0.6s ease;
`;

export const AfinLabel = styled.div`
  font-size: 0.68rem;
  color: #c9a42a;
  white-space: nowrap;
  flex-shrink: 0;
`;

/* ── Visuals row: spider + tree side by side on desktop ──────── */

export const VisualsRow = styled.div`
  display: flex;
  gap: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border);
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

export const AdnSection = styled.div`
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const AdnChartWrapper = styled.div`
  width: 100%;
  max-width: 280px;
  margin: 0 auto;

  @media (max-width: 768px) {
    max-width: 380px;
  }
`;

export const TreeSection = styled.div`
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    width: 100%;
  }
`;
