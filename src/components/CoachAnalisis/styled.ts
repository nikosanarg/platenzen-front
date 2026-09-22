import styled from 'styled-components';
import { Panel } from '@/components/Panel';
import { InsightTone } from '@/lib/coachAnalisis';

function toneColor(tone: InsightTone): string {
  if (tone === 'positive') return 'var(--positive)';
  if (tone === 'warning') return 'var(--warning)';
  return 'var(--text-secondary)';
}

export const Root = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const Card = styled(Panel)`
  overflow: hidden;
`;

/** El historial, a lo ancho de la card, debajo del separador de impacto. */
export const ActivitiesSection = styled.div`
  padding: 1.25rem 1.5rem 1.5rem;

  @media (max-width: 1080px) {
    padding: 1.15rem 1.15rem 1.25rem;
  }
`;

/** Sólo las dos columnas de arriba: mapa y detalle. El resto va debajo, a lo ancho. */
export const MainGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  grid-template-areas: "activity insights";
  align-items: start;
  gap: 1.25rem 1.5rem;
  padding: 1.5rem;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "activity"
      "insights";
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
  border: 1px solid rgba(var(--accent-rgb), 0.25);
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
  color: var(--accent);
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
      ? 'rgba(var(--positive-rgb), 0.12)'
      : $tone === 'warning'
      ? 'rgba(var(--warning-rgb), 0.12)'
      : 'rgba(var(--text-secondary-rgb), 0.12)'};
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

/* ── Impacto Platenzen: qué movió la salida en tu progreso ───────── */

/**
 * Una sola fila con todo inline: separa el coach de arriba (mapa y detalle)
 * del historial de abajo, a lo ancho completo de la card. Antes eran cuatro
 * filas apiladas (XP, chips de XP, chips de ADN, logros); ahora es una tira
 * que se lee de un vistazo y no pesa como una sección propia.
 */
export const ImpactoStrip = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);

  @media (max-width: 1080px) {
    padding: 0.9rem 1.15rem;
  }
`;

export const ImpactoLabel = styled.span`
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  flex-shrink: 0;
`;

export const XPBig = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--gold);
`;

export const XPChip = styled.div`
  font-size: 0.72rem;
  color: var(--text-muted);
  background: var(--bg-primary);
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
`;

export const DNAChip = styled.div<{ $positive: boolean }>`
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  border: 1px solid ${({ $positive }) => $positive ? 'rgba(var(--positive-rgb), 0.3)' : 'rgba(var(--error-rgb), 0.3)'};
  background: ${({ $positive }) => $positive ? 'rgba(var(--positive-rgb), 0.06)' : 'rgba(var(--error-rgb), 0.06)'};
  color: ${({ $positive }) => $positive ? 'var(--positive)' : 'var(--error)'};
`;

export const LevelUpBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-muted);
  border: 1px solid rgba(var(--accent-rgb), 0.3);
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
`;

export const AchievementChip = styled.div`
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.625rem;
  border-radius: 4px;
  border: 1px solid rgba(var(--gold-rgb), 0.4);
  background: rgba(var(--gold-rgb), 0.08);
  color: var(--gold);
`;
