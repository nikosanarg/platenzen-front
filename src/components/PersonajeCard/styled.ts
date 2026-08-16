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

/* ── Top row: resumen · radar · árbol de habilidades ─────────────── */

export const TopRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.15fr) minmax(0, 1.1fr);
  gap: 1.75rem;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 1.5rem;
  }

  @media (max-width: 760px) {
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

/** Al ancho del tablero del árbol, para que las dos piezas pesen lo mismo. */
export const AdnChartWrapper = styled.div`
  width: 100%;
  max-width: 325px;
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

/* ── Encabezados y pie de las columnas visuales ──────────────────── */

export const VisualColTitle = styled.h3`
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 0.75rem;
`;

/** Aclara qué significa el polígono punteado del radar. */
export const RadarNote = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.68rem;
  color: var(--text-muted);
  text-align: center;
  margin-top: 0.4rem;
`;

export const RadarNoteDot = styled.span`
  display: inline-block;
  width: 14px;
  height: 0;
  flex-shrink: 0;
  border-top: 2px dashed #ef4444;
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
