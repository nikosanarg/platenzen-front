import styled from 'styled-components';
import { Panel } from '@/components/Panel';

/**
 * El ancho del tablero vive acá, en la card, porque lo usa el perfil de ramas
 * (`AdnChartWrapper`): un solo lugar donde cambiarlo.
 */
export const Card = styled(Panel)`
  --board-max: 320px;

  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  @media (max-width: 600px) {
    padding: 1.5rem 1.25rem;
    gap: 1.15rem;
  }
`;

/* ── Top row: resumen · perfil de ramas ───────────────────────────── */

/** Columna 1: quién sos y los tres números gruesos. Columna 2: el perfil de ramas. */
export const TopRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 1.75rem;
  align-items: start;

  @media (max-width: 1100px) {
    gap: 1.5rem;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
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
  max-width: var(--board-max);
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

/**
 * Sólo aparece cuando dos ramas empatan en nivel y porcentaje: el título es
 * una decisión ("Veintiunero" vs. "Pasadista") que igual de bien podría ser
 * la otra, así que se ofrece el cambio en vez de elegir en silencio.
 */
export const SwitchChip = styled.button`
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--gold);
  background: rgba(var(--gold-rgb), 0.1);
  border: 1px solid rgba(var(--gold-rgb), 0.35);
  border-radius: 999px;
  padding: 0.2rem 0.7rem;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: rgba(var(--gold-rgb), 0.18);
  }

  &:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
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

/**
 * El registro de referencia: la distancia nucleo mas alta que el corredor
 * alcanzo y su mejor tiempo ahi. Va pegado al titulo porque es el dato
 * concreto que respalda el nombre de la rama, que por si solo es una etiqueta.
 */
export const CoreRecord = styled.p`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.65rem;
`;

export const CoreRecordValue = styled.span`
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: -0.02em;

  @media (max-width: 600px) {
    font-size: 1.15rem;
  }
`;

export const CoreRecordLabel = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
`;

export const PersonaText = styled.p`
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-top: 0.85rem;
`;

/* ── Stat cards ───────────────────────────────────────────────────── */

/**
 * Los tres en la misma fila. `auto-fit` con un mínimo chico es lo que cumple
 * "inline salvo en casos extremos" sin un breakpoint inventado: mientras las
 * tres columnas entren, quedan en fila; recién cuando no, bajan solas.
 */
export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 0.85rem 1rem;
  margin-top: 1.15rem;

  @media (max-width: 600px) {
    gap: 0.7rem 0.6rem;
    margin-top: 0.9rem;
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

/**
 * Sin `nowrap`: que "Semanas al hilo" pueda partirse en dos líneas es lo que
 * deja entrar las tres tarjetas en fila en un teléfono angosto.
 */
export const StatLabel = styled.div`
  font-size: 0.68rem;
  color: var(--text-muted);
  line-height: 1.25;
  min-width: 0;
`;

/* ── Pie de la columna visual ─────────────────────────────────────── */

export const VisualPanel = styled.div``;

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



/* ── Constancia: el heatmap, dentro de la columna de identidad ────── */

export const ActivitySection = styled.div`
  width: 100%;
  margin-top: 1.25rem;
`;
