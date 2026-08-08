import styled from 'styled-components';
import { InsightTone, DayKind } from '@/lib/coachAnalisis';

function toneColor(tone: InsightTone): string {
  if (tone === 'positive') return '#4ade80';
  if (tone === 'warning') return '#f59e0b';
  return 'var(--text-secondary)';
}

const ACTIVE_KINDS: DayKind[] = ['done', 'run'];

export const Root = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Card = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
`;

/* ── Header ─────────────────────────────────────────────── */

export const CardHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;

  @media (max-width: 600px) {
    padding: 1.15rem 1.15rem;
  }
`;

export const HeadTitle = styled.h2`
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-primary);
`;

export const HeadSubtitle = styled.span`
  font-size: 0.8rem;
  color: var(--text-muted);
`;

/* ── Main grid: actividad + observaciones, y la agenda a lo ancho ─────────── */

export const MainGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  grid-template-areas:
    "activity insights"
    "agenda   agenda";
  align-items: start;
  gap: 1.25rem 1.5rem;
  padding: 1.5rem;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "activity"
      "insights"
      "agenda";
    padding: 1.25rem 1.15rem;
  }
`;

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
`;

export const ColDivider = styled(Column)`
  @media (min-width: 1081px) {
    border-left: 1px solid var(--border);
    padding-left: 1.5rem;
    margin-left: -0.5rem;
  }
`;

export const ColActivity = styled(Column)`
  grid-area: activity;
`;

export const ColInsights = styled(ColDivider)`
  grid-area: insights;
`;

export const ColTitle = styled.div`
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
`;

/* ── Activity (left) ────────────────────────────────────── */

export const ActivityHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const ActivityIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent-muted);
  border: 1px solid rgba(252, 76, 2, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const ActivityName = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
`;

export const ActivityDate = styled.div`
  font-size: 0.97rem;
  color: var(--text-muted);
  margin-top: 0.15rem;
`;

export const StatsRow = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

export const StatValue = styled.div`
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
`;

export const StatUnit = styled.span`
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-left: 0.15rem;
`;

export const StatLabel = styled.div`
  font-size: 0.89rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
`;

export const MapContainer = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const MapSvg = styled.svg`
  width: 100%;
  height: 100%;
`;

export const MapNoData = styled.div`
  font-size: 0.72rem;
  color: var(--text-muted);
`;

export const StravaLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #fc4c02;
  align-self: flex-start;

  &:hover {
    text-decoration: underline;
  }
`;

/* ── Insights (middle) ──────────────────────────────────── */

export const InsightList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

export const InsightItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--text-secondary);
`;

export const InsightIcon = styled.div<{ $tone: InsightTone }>`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.05rem;
  color: ${({ $tone }) => toneColor($tone)};
  background: ${({ $tone }) =>
    $tone === 'positive'
      ? 'rgba(74, 222, 128, 0.12)'
      : $tone === 'warning'
      ? 'rgba(245, 158, 11, 0.12)'
      : 'rgba(144, 144, 168, 0.12)'};
`;

/* Seis destacados en 3 × 2; bajan a 2 y a 1 columna según el ancho. */
export const HighlightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.35rem;

  @media (max-width: 860px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

export const HighlightCardBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.7rem 0.8rem;
`;

export const HighlightIcon = styled.div<{ $tone: InsightTone }>`
  flex-shrink: 0;
  color: ${({ $tone }) => toneColor($tone)};
  display: flex;
  align-items: center;
  margin-top: 0.1rem;
`;

export const HighlightBody = styled.div`
  min-width: 0;
`;

export const HighlightValue = styled.div<{ $tone: InsightTone }>`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ $tone }) => toneColor($tone)};
  line-height: 1.1;
`;

export const HighlightLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
`;

export const HighlightSub = styled.div`
  font-size: 0.66rem;
  color: var(--text-muted);
  margin-top: 0.1rem;
`;

/* ── Agenda: Ayer → +72h, en una tira horizontal ─────────── */

/* Los separadores son el fondo del contenedor asomando por el gap de 1px: así
   siguen cayendo donde corresponde cuando las celdas envuelven a dos filas. */
export const AgendaStrip = styled.div`
  grid-area: agenda;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;

  @media (max-width: 860px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const AgendaCell = styled.div<{ $today?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.85rem 0.9rem;
  min-width: 0;
  background: ${({ $today }) => ($today ? 'rgba(252, 76, 2, 0.07)' : 'var(--bg-card)')};
`;

export const AgendaDay = styled.div<{ $today?: boolean }>`
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ $today }) => ($today ? 'var(--accent)' : 'var(--text-muted)')};
`;

export const AgendaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
`;

export const AgendaIcon = styled.div<{ $kind: DayKind }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $kind }) => (ACTIVE_KINDS.includes($kind) ? '#4ade80' : 'var(--text-muted)')};
  background: ${({ $kind }) =>
    ACTIVE_KINDS.includes($kind) ? 'rgba(74, 222, 128, 0.12)' : 'rgba(144, 144, 168, 0.1)'};
  border: 1px solid ${({ $kind }) =>
    ACTIVE_KINDS.includes($kind) ? 'rgba(74, 222, 128, 0.25)' : 'var(--border)'};
`;

export const AgendaLabel = styled.div<{ $muted?: boolean }>`
  font-weight: 600;
  line-height: 1.25;
  min-width: 0;
  color: ${({ $muted }) => ($muted ? 'var(--text-muted)' : 'var(--text-primary)')};
  text-transform: ${({ $muted }) => ($muted ? 'uppercase' : 'none')};
  letter-spacing: ${({ $muted }) => ($muted ? '0.06em' : 'normal')};
  font-size: ${({ $muted }) => ($muted ? '0.72rem' : '0.8rem')};
`;

