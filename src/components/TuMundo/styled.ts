import styled from 'styled-components';
import { Panel } from '@/components/Panel';

export const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

export const MapHint = styled.p`
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: -0.35rem;
`;

/**
 * Mapa (ancho) + lista de lugares (angosta), mismo corte de 900px que ya usa
 * el resto del producto (`HistoriaLayout` en Dashboard/styled) para pasar de
 * escritorio a teléfono. Abajo de eso, el mapa manda primero y la lista baja
 * completa después — en el orden en que aparece en el DOM.
 */
export const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

/** Alto compartido por el mapa y la lista: que la sidebar no quede más alta ni más baja que el mapa. */
export const MAP_HEIGHT = '560px';

export const HeatmapContainer = styled(Panel)`
  overflow: hidden;
  position: relative;
  height: ${MAP_HEIGHT};

  @media (max-width: 600px) {
    height: 420px;
  }
`;

export const HeatmapSvg = styled.svg`
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
`;

/** Foco de teclado en un lugar del mapa: el círculo no lo muestra, el aro sí. */
export const MarkerGroup = styled.g`
  outline: none;

  circle {
    transition: opacity 0.2s ease;
  }

  &:focus-visible circle:first-child {
    stroke: var(--text-on-accent);
    stroke-width: 2;
    stroke-dasharray: 2 2;
  }
`;

export const Tooltip = styled.div<{ $visible: boolean }>`
  pointer-events: none;
  position: absolute;
  background: rgba(10, 10, 15, 0.94);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: var(--text-primary);
  opacity: ${props => (props.$visible ? 1 : 0)};
  transition: opacity 0.15s;
  white-space: nowrap;
  z-index: 10;
`;

export const EmptyState = styled(Panel)`
  padding: 3rem 2rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
  box-shadow: var(--shadow-sm);
`;

export const ZoomControls = styled.div`
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ZoomButton = styled.button`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`;

/* ── Sidebar: lista de lugares o detalle de uno solo ──────────────── */

export const Sidebar = styled(Panel)`
  display: flex;
  flex-direction: column;
  height: ${MAP_HEIGHT};
  padding: 1rem;
  min-width: 0;

  @media (max-width: 900px) {
    height: auto;
    max-height: 480px;
  }
`;

export const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
`;

export const SidebarTitle = styled.h3`
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-primary);
`;

export const SortSwitch = styled.div`
  display: inline-flex;
  gap: 0.2rem;
  padding: 0.2rem;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  flex-shrink: 0;
`;

export const SortButton = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? 'var(--accent)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--text-on-accent)' : 'var(--text-secondary)')};
  border: none;
  border-radius: var(--radius);
  padding: 0.25rem 0.55rem;
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    color: ${({ $active }) => ($active ? 'var(--text-on-accent)' : 'var(--text-primary)')};
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
`;

/** Mismo tratamiento que el ranking de "Lugares más frecuentados" en Progreso: `LeftVisual` no pone color, cada lista pone el suyo. */
export const PlaceRank = styled.span`
  color: var(--text-muted);
`;

export const PlaceScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  min-height: 0;
`;

/* ── Detalle de un lugar ───────────────────────────────────────────── */

export const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  align-self: flex-start;
  background: none;
  border: none;
  padding: 0;
  margin-bottom: 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  flex-shrink: 0;

  svg {
    transform: rotate(-90deg);
  }

  &:hover {
    color: var(--text-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

export const DetailScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  overflow-y: auto;
  min-height: 0;
`;

export const DetailTitle = styled.h4`
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.25;
`;

export const DetailStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.625rem;
`;

export const DetailStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

export const DetailStatValue = styled.div`
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-primary);
`;

export const DetailStatLabel = styled.div`
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
`;

export const TrendRow = styled.div<{ $tone: 'positive' | 'warning' | 'neutral' }>`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: ${({ $tone }) =>
    $tone === 'positive' ? 'var(--positive)' : $tone === 'warning' ? 'var(--warning)' : 'var(--text-secondary)'};
  background: var(--bg-primary);
  border-radius: var(--radius);
  padding: 0.5rem 0.65rem;
`;

export const TrendPace = styled.span`
  font-family: var(--font-num);
  font-weight: 700;
`;

export const ActivitiesLabel = styled.div`
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
`;

export const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

export const ActivityRow = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  width: 100%;
  text-align: left;
  background: ${({ $active }) => ($active ? 'var(--accent-muted)' : 'transparent')};
  border: none;
  border-radius: var(--radius);
  padding: 0.35rem 0.4rem;
  cursor: pointer;
  font-size: 0.75rem;
  color: ${({ $active }) => ($active ? 'var(--accent)' : 'var(--text-secondary)')};

  &:hover {
    background: var(--bg-card-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
`;

export const ActivityRowName = styled.span`
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ActivityRowStats = styled.span`
  font-family: var(--font-num);
  flex-shrink: 0;
  color: var(--text-muted);
`;

export const ShowAllButton = styled.button`
  align-self: flex-start;
  background: none;
  border: none;
  padding: 0.3rem 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--accent);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;
