import styled from 'styled-components';
import { Panel } from '@/components/Panel';

/**
 * El ancho del tablero y el alto reservado para el panel viven acá, en la card,
 * porque los comparten las dos vistas del perfil: el radar (`AdnChartWrapper`) y
 * el árbol (`SkillTree`, que hereda la variable). Un solo lugar donde cambiarlos
 * es lo que mantiene las dos lecturas del mismo cálculo del mismo tamaño.
 *
 * `--panel-min` es el alto de la vista más alta —el árbol, con su franja de
 * requisitos— y equivale al tablero más ~114px de pie.
 */
export const Card = styled(Panel)`
  --board-max: 320px;
  --panel-min: 434px;

  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;

  @media (max-width: 600px) {
    padding: 1.75rem 1.25rem;
    gap: 1.5rem;
  }
`;

/* ── Top row: resumen · perfil (radar o árbol) ───────────────────── */

/**
 * Dos columnas mientras haya ancho para que la identidad y el perfil se lean a
 * la par; por debajo de 900px una sola, que es también donde el perfil deja de
 * entrar al lado.
 *
 * Apilado, el orden natural —identidad, perfil, año— empuja el heatmap fuera de
 * la primera pantalla. `display: contents` disuelve la grilla y sube las
 * columnas a hijas directas de la card, que es lo que habilita reordenarlas:
 * identidad, año en actividad, y recién después el perfil, que es la pieza que
 * se explora y no la que se lee de una.
 */
export const TopRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 1.75rem;
  align-items: start;

  @media (max-width: 1100px) {
    gap: 1.5rem;
  }

  @media (max-width: 900px) {
    display: contents;
  }
`;

export const IdentityCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;

  @media (max-width: 900px) {
    order: 1;
  }
`;

export const VisualCol = styled.div`
  min-width: 0;

  @media (max-width: 900px) {
    width: 100%;
    order: 3;
  }
`;

/** El mismo ancho que el tablero del árbol: las dos vistas comparten la base. */
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

  @media (max-width: 600px) {
    gap: 0.7rem 0.75rem;
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

export const StatLabel = styled.div`
  font-size: 0.68rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/* ── Conmutador y pie de la columna visual ───────────────────────── */

/**
 * Radar y árbol dibujan el mismo cálculo —las seis ramas de `branchTree`— así
 * que no son dos piezas sino dos lecturas de una: el radar responde "cómo estoy
 * parado", el árbol "qué me falta". Lado a lado competían por la atención y
 * duplicaban el alto de la card; acá comparten base (mismo ancho de tablero,
 * mismo pie) y se conmutan.
 */
export const VisualSwitch = styled.div`
  display: flex;
  justify-content: center;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 0.75rem;
`;

export const VisualSwitchBtn = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  border-bottom: 2px solid ${({ $active }) => ($active ? 'var(--accent)' : 'transparent')};
  padding: 0.4rem 1rem;
  font-size: 0.68rem;
  font-weight: ${({ $active }) => ($active ? '700' : '500')};
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: ${({ $active }) => ($active ? 'var(--text-primary)' : 'var(--text-muted)')};
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
  margin-bottom: -1px;

  &:hover {
    color: var(--text-secondary);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

/**
 * Reserva el alto de la vista más alta para que conmutar no corra media página
 * hacia arriba. En el teléfono no se reserva: el panel es lo último de la card,
 * no hay contenido arriba que se mueva, y una pantalla en blanco costaría más
 * que el salto.
 */
export const VisualPanel = styled.div`
  min-height: var(--panel-min);

  @media (max-width: 900px) {
    min-height: 0;
  }
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

  @media (max-width: 900px) {
    order: 2;
  }
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
