import Link from 'next/link';
import styled from 'styled-components';

export const Root = styled.section``;

export const PlaceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

/** +6px sobre el resto de la card: es lo primero que se lee de la fila. */
export const PlaceRank = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 1.5rem;
  text-align: right;
`;

export const PlaceVisits = styled.div`
  font-size: 0.75rem;
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
