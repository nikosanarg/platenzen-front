import styled from 'styled-components';
import { glassHover } from '@/components/Panel';

/**
 * `as="a"` cuando hay `href` (un lugar externo, casi siempre Strava), `as="button"`
 * cuando hay `onClick` (una acción local, como abrir el modal de "Tu Mundo"). El
 * hueco de la derecha para el cartel de Strava sólo se reserva cuando existe.
 */
export const Card = styled.div<{ $featured: boolean; $withStravaBadge: boolean }>`
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  background: var(--bg-card);
  border: 1px solid ${({ $featured }) => ($featured ? 'rgba(var(--gold-rgb), 0.22)' : 'transparent')};
  border-radius: var(--radius-sm);
  padding: ${({ $withStravaBadge }) => ($withStravaBadge ? '0.55rem 1.6rem 0.55rem 0.85rem' : '0.55rem 0.85rem')};
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: background 0.15s, border-color 0.15s, backdrop-filter 0.15s;

  ${({ $featured }) => glassHover($featured ? 'var(--gold-rgb)' : 'var(--accent-rgb)')}

  &:focus-visible {
    outline: 2px solid ${({ $featured }) => ($featured ? 'var(--gold)' : 'var(--accent)')};
    outline-offset: 2px;
  }
`;

/**
 * Columna sola a la izquierda, compartida por las tres listas: el "#1" de
 * lugares, el "5K" de récords, el emoji del logro en sesiones legendarias.
 * El tamaño base vive acá para que las tres se vean del mismo peso visual —
 * cada sección sólo define su color.
 */
export const LeftVisual = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  font-size: 1.125rem;
  font-weight: 700;
`;

export const Info = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

export const Title = styled.div<{ $featured: boolean }>`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ $featured }) => ($featured ? 'var(--gold)' : 'var(--text-primary)')};
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** Cada subtítulo es su propia fila, sin pareja a la derecha — eso vive en `RightVisual`. */
export const SubtitleLine = styled.div`
  font-size: 0.7rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * Columna sola a la derecha, simétrica a `LeftVisual`: el valor principal
 * (tiempo, visitas) y el secundario (mejora, fecha) apilados e
 * independientes de las filas de `Info` — no una pareja fila por fila.
 */
export const RightVisual = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
  text-align: right;
`;

export const PrimaryValue = styled.div`
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  white-space: nowrap;
`;

export const SecondaryValue = styled.div`
  font-size: 0.72rem;
  color: var(--text-muted);
  white-space: nowrap;
`;
