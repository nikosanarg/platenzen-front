import Link from 'next/link';
import styled from 'styled-components';

export const Root = styled.section``;

export const PlaceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

/** Tamaño y peso los hereda de `LeftVisual` en `StatCard`; acá sólo el color. */
export const PlaceRank = styled.span`
  color: var(--text-muted);
`;

/** Mismo tamaño que `PlaceRank`/`DistanceLabel`: los tres son el dato principal de su columna. */
export const PlaceVisits = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--accent);
  white-space: nowrap;
`;

export const MoreRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
`;

export const MoreLink = styled(Link)`
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  padding: 0.45rem 1.1rem;
  text-decoration: none;

  &:hover {
    color: var(--accent);
    background: var(--bg-card-hover);
  }
`;
