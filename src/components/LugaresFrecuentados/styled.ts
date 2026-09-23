import Link from 'next/link';
import styled from 'styled-components';

export const Root = styled.section``;

export const PlaceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const PlaceItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  background: var(--bg-card);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0.6rem 0.85rem;
  cursor: pointer;
  text-align: left;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: rgba(var(--accent-rgb), 0.35);
    background: rgba(var(--accent-rgb), 0.05);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

/** +6px sobre el resto de la card: es lo primero que se lee de la fila. */
export const PlaceRank = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 1.5rem;
  text-align: right;
`;

export const PlaceInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const PlaceName = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const PlaceMeta = styled.div`
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 0.125rem;
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
