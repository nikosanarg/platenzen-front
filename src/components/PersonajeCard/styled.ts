import styled from 'styled-components';
import { Panel } from '@/components/Panel';

export const Card = styled(Panel)`
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;

  @media (max-width: 600px) {
    padding: 1.75rem 1.25rem;
    gap: 1.5rem;
  }
`;

/* ── Top row: identity · spider · role tree ──────────────────────── */

export const TopRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 1.15fr);
  gap: 1.75rem;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

export const IdentityCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
`;

export const VisualCol = styled.div`
  min-width: 0;

  @media (max-width: 900px) {
    width: 100%;
  }
`;

export const AdnChartWrapper = styled.div`
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
`;

/* ── Identity header ─────────────────────────────────────────────── */

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
  border: 1px solid rgba(var(--accent-rgb), 0.25);
  border-radius: 999px;
  padding: 0.1rem 0.6rem;
`;

/* ── Chromatic level-progress bar ────────────────────────────────── */

export const LevelBarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 0.6rem;
`;

export const LevelTrack = styled.div`
  flex: 1;
  height: 8px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
`;

export const LevelFill = styled.div<{ $pct: number }>`
  height: 100%;
  border-radius: 999px;
  width: ${({ $pct }) => Math.max(2, $pct * 100).toFixed(1)}%;
  /* The gradient spans the full track width so the fill reveals the
     chromatic scale up to the current progress point. */
  background-image: var(--role-gradient);
  background-size: ${({ $pct }) => (100 / Math.max(0.02, $pct)).toFixed(1)}% 100%;
  background-position: left center;
  background-repeat: no-repeat;
  transition: width 0.8s ease;
`;

export const LevelEndpoint = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
`;

export const LevelEndpointDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--text-muted);
`;

export const LevelEndpointLabel = styled.div`
  font-size: 0.6rem;
  color: var(--text-muted);
  white-space: nowrap;
  letter-spacing: 0.02em;
`;

/* ── XP headline: el número de XP es el dato central de la progresión ── */

export const XpHeadRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  flex-wrap: wrap;
`;

export const XpBigValue = styled.span`
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1;

  @media (max-width: 600px) {
    font-size: 1.3rem;
  }
`;

export const XpMeta = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
`;

export const XpToNext = styled.div`
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.3rem;
`;

/* ── Persona description ──────────────────────────────────────────── */

export const PersonaText = styled.p`
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-top: 0.85rem;
`;

/* ── Stat cards ───────────────────────────────────────────────────── */

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem 1rem;
  margin-top: 1.15rem;

  @media (max-width: 440px) {
    grid-template-columns: 1fr;
  }
`;

export const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
`;

export const StatIcon = styled.div<{ $emphasis?: boolean }>`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $emphasis }) => ($emphasis ? 'var(--accent)' : 'var(--accent-muted)')};
  color: ${({ $emphasis }) => ($emphasis ? 'var(--text-on-accent)' : 'var(--accent)')};
  flex-shrink: 0;
`;

export const StatBody = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
`;

export const StatValue = styled.div<{ $emphasis?: boolean }>`
  font-size: ${({ $emphasis }) => ($emphasis ? '1.15rem' : '0.98rem')};
  font-weight: ${({ $emphasis }) => ($emphasis ? '800' : '700')};
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StatLabel = styled.div`
  font-size: 0.68rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* ── Rango: progreso dentro de la rama dominante ─────────────────── */

export const VisualColTitle = styled.h3`
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 0.75rem;
`;

export const RankBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding-top: 0.5rem;
`;

export const RankCurrentRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  text-align: center;
`;

export const RankCurrentName = styled.div`
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: var(--text-primary);
  text-transform: uppercase;
`;

export const RankPct = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent);
`;

export const RankNextName = styled.span`
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
`;

export const RankProgressTrack = styled.div`
  height: 6px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
  width: 100%;
  max-width: 220px;
`;

export const RankProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => Math.max(2, Math.min(100, $pct)).toFixed(1)}%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.6s ease;
`;

export const RankStepsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  flex-wrap: wrap;
`;

export const RankStep = styled.span<{ $state: 'done' | 'current' | 'upcoming' }>`
  font-size: 0.64rem;
  font-weight: ${({ $state }) => ($state === 'current' ? '700' : '500')};
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: ${({ $state }) =>
    $state === 'current'
      ? 'var(--accent)'
      : $state === 'done'
      ? 'var(--text-secondary)'
      : 'var(--text-muted)'};
`;

export const RankStepArrow = styled.span`
  font-size: 0.64rem;
  color: var(--text-muted);
`;

export const RankMaxNote = styled.div`
  text-align: center;
  font-size: 0.72rem;
  color: var(--text-muted);
`;

/* ── Activity heatmap (full-width, bottom) ───────────────────────── */

export const ActivitySection = styled.div`
  width: 100%;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
`;

export const ActivityTitle = styled.h3`
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-muted);
  margin-bottom: 0.3rem;
`;

export const ActivitySubtitle = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
`;
