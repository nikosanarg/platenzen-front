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

/* ── Top row: resumen · perfil de ramas · constancia ─────────────────
 *
 * Tres áreas con nombre, no dos columnas con el heatmap adentro de la
 * primera: así el heatmap puede tener su propia fila en mobile sin que el
 * orden del DOM (y con él, el de lectura y tabulación) deje de coincidir con
 * el visual. `radar` ocupa las dos filas de su columna en desktop — el mismo
 * resultado que antes, cuando era la única celda de esa columna y el resto
 * del espacio bajo el radar quedaba vacío por `align-items: start`.
 */
export const TopRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  grid-template-areas:
    'data    radar'
    'heatmap radar';
  gap: 1.75rem;
  align-items: start;

  @media (max-width: 1100px) {
    gap: 1.5rem;
  }

  /* 60/40 entre datos y radar; el heatmap pasa a su propia fila completa. */
  @media (max-width: 900px) {
    grid-template-columns: 3fr 2fr;
    grid-template-areas:
      'data    radar'
      'heatmap heatmap';
  }
`;

export const IdentityMain = styled.div`
  grid-area: data;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
`;

export const VisualCol = styled.div`
  grid-area: radar;
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

export const StatIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: var(--text-on-accent);
  flex-shrink: 0;
`;

export const StatBody = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
`;

export const StatValue = styled.div`
  font-size: 1.23rem;
  font-weight: 800;
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


/* ── Constancia: el heatmap, dentro de la columna de identidad ────── */

export const ActivitySection = styled.div`
  grid-area: heatmap;
  width: 100%;
  min-width: 0;
`;
