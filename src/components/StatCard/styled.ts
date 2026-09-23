import styled, { css } from 'styled-components';
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
  background: ${({ $featured }) =>
    $featured
      ? 'linear-gradient(135deg, rgba(var(--gold-rgb), 0.07), var(--bg-card) 65%)'
      : 'var(--bg-card)'};
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

export const LeftVisual = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
`;

export const Info = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const rowBase = css`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const TopRow = styled.div`
  ${rowBase}
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

export const PrimaryValue = styled.div`
  flex-shrink: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
`;

export const SubRow = styled.div`
  ${rowBase}
  font-size: 0.7rem;
  color: var(--text-muted);
`;

export const SecondaryValue = styled.span`
  flex-shrink: 0;
  color: var(--text-muted);
`;

export const ExtraLine = styled.div`
  font-size: 0.66rem;
  color: var(--text-muted);
`;
