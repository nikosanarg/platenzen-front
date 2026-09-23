import styled, { css } from 'styled-components';
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
    'stats   radar'
    'heatmap radar';
  gap: 1.75rem;
  align-items: start;

  @media (max-width: 1100px) {
    gap: 1.5rem;
  }

  /*
   * 50/50 entre datos y radar. Los tres indicadores dejan de competir por el
   * ancho de la columna de datos —wrapeaban con puntos suspensivos— y pasan
   * a su propia fila completa, entre el radar y el heatmap.
   */
  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      'data    radar'
      'stats   stats'
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
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
`;

export const LevelBadge = styled.span`
  font-size: calc(0.72rem + 2px);
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-card-hover);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.2rem 0.7rem;
  letter-spacing: 0.03em;
  white-space: nowrap;
`;

export const RoleNamePrimary = styled.h2`
  font-size: calc(2rem + 4px);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: 1.1;

  @media (max-width: 600px) {
    font-size: 1.5rem;
  }
`;

/* ── Selector de rama: "Veintiunero" como dropdown cuando hay otra rama empatada ── */

export const RoleDropdown = styled.div`
  position: relative;
`;

/**
 * Todo transparente salvo el borde y el chevron — un naranja apenas
 * insinuado, no un botón sólido — para que siga leyéndose como el título
 * de la card, no como una acción. `$interactive` en false (una sola rama,
 * nada para elegir) saca el borde entero y vuelve a ser texto plano.
 */
export const RoleDropdownTrigger = styled.button<{ $interactive: boolean; $open: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: 1px solid ${({ $interactive }) => ($interactive ? 'rgba(var(--accent-rgb), 0.45)' : 'transparent')};
  border-radius: var(--radius-sm);
  padding: ${({ $interactive }) => ($interactive ? '0.15rem 0.6rem' : '0')};
  margin: ${({ $interactive }) => ($interactive ? '-0.15rem -0.6rem' : '0')};
  color: var(--text-primary);
  font-size: calc(2rem + 4px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  cursor: ${({ $interactive }) => ($interactive ? 'pointer' : 'default')};

  @media (max-width: 600px) {
    font-size: 1.5rem;
  }

  &:hover {
    border-color: ${({ $interactive }) => ($interactive ? 'rgba(var(--accent-rgb), 0.7)' : 'transparent')};
  }
`;

export const RoleDropdownList = styled.ul`
  position: absolute;
  z-index: 20;
  top: calc(100% + 0.4rem);
  left: 0;
  min-width: 12rem;
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
`;

export const RoleDropdownOptionButton = styled.button<{ $active: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.7rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ $active }) => ($active ? 'var(--accent)' : '#fff')};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: var(--accent);
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

  @media (max-width: 900px) {
    display: none;
  }
`;

/* ── Stat cards ───────────────────────────────────────────────────── */

/**
 * Los tres en la misma fila. `auto-fit` con un mínimo chico es lo que cumple
 * "inline salvo en casos extremos" sin un breakpoint inventado: mientras las
 * tres columnas entren, quedan en fila; recién cuando no, bajan solas.
 *
 * Área propia del grid (`stats`), no hija de `IdentityMain`: en mobile el
 * ancho de la columna de datos es la mitad de la card, donde el mínimo de
 * 96px de auto-fit no entra tres veces y las tarjetas wrapeaban con puntos
 * suspensivos. Con su propia fila a lo ancho completo —entre el radar y el
 * heatmap— vuelve a tener el espacio que necesita.
 */
export const StatsGrid = styled.div`
  grid-area: stats;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 0.85rem 1rem;

  @media (max-width: 600px) {
    gap: 0.7rem 0.6rem;
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
 * Una sola condición (el ancho medido de `StatsGrid`, ver `useCompactStats`
 * en index.tsx) decide si las tres etiquetas están en una línea o en dos —
 * nunca cada una por su cuenta. Sin esto, "actividades registradas" (la más
 * larga) se partía sola mientras las otras dos quedaban en una línea, y las
 * tres tarjetas terminaban de alturas distintas.
 *
 * `$compact` en vez de `@container`: en esta grilla en particular (adentro
 * de un `grid-area` cuyo ancho lo da `fr` de un grid ancestro, no un ancho
 * propio) Chrome no volvía a evaluar la container query al cambiar de
 * tamaño — un `ResizeObserver` mide directo y no depende de esa cadena.
 */
export const StatLabel = styled.div<{ $compact: boolean }>`
  font-size: 0.68rem;
  color: var(--text-muted);
  line-height: 1.25;
  min-width: 0;

  ${({ $compact }) =>
    $compact
      ? css`
          white-space: normal;
          overflow: visible;
          text-overflow: clip;
        `
      : css`
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `}
`;

/* ── Pie de la columna visual ─────────────────────────────────────── */

export const VisualPanel = styled.div``;


/* ── Constancia: el heatmap, dentro de la columna de identidad ────── */

export const ActivitySection = styled.div`
  grid-area: heatmap;
  width: 100%;
  min-width: 0;
`;
