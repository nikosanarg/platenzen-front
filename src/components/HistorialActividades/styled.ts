import styled from 'styled-components';

export const Root = styled.section``;

export const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
`;

/**
 * Mismo look que `SectionTitle` (Dashboard/styled), pero como botón: es el
 * control para abrir la sección la primera vez que se ve, colapsada.
 */
export const ToggleTitle = styled.button`
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-primary);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;

  &:hover {
    color: var(--accent);
  }
`;

export const SortTabs = styled.div`
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
`;

export const SortTab = styled.button<{ $active: boolean }>`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  border: 1px solid ${({ $active }) => $active ? 'rgba(var(--accent-rgb), 0.35)' : 'var(--border)'};
  background: ${({ $active }) => $active ? 'var(--accent-muted)' : 'transparent'};
  color: ${({ $active }) => $active ? 'var(--accent)' : 'var(--text-muted)'};

  &:hover:not([aria-pressed='true']) {
    color: var(--text-secondary);
    border-color: var(--text-muted);
  }
`;

/** Filas, no tarjetas: la lista vive angosta, al lado del bloque de impacto. */
export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

export const ListRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid var(--border);
  min-width: 0;

  &:last-child {
    border-bottom: none;
  }
`;

export const RowDate = styled.span`
  font-size: 0.68rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  width: 3.2rem;
`;

export const RowName = styled.h4`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
`;

export const RowStats = styled.span`
  font-size: 0.72rem;
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
`;

export const Paginator = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  margin-top: 0.9rem;
`;

const pageButtonBase = `
  min-width: 1.6rem;
  height: 1.6rem;
  padding: 0 0.3rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  transition: border-color 0.15s, background 0.15s, color 0.15s;

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

export const PageNavButton = styled.button`
  ${pageButtonBase}
  font-size: 0.95rem;
  line-height: 1;

  &:hover:not(:disabled) {
    color: var(--accent);
    border-color: rgba(var(--accent-rgb), 0.35);
  }
`;

export const PageButton = styled.button<{ $active: boolean }>`
  ${pageButtonBase}
  border-color: ${({ $active }) => $active ? 'rgba(var(--accent-rgb), 0.35)' : 'transparent'};
  background: ${({ $active }) => $active ? 'var(--accent-muted)' : 'transparent'};
  color: ${({ $active }) => $active ? 'var(--accent)' : 'var(--text-muted)'};

  &:hover:not(:disabled) {
    color: ${({ $active }) => $active ? 'var(--accent)' : 'var(--text-secondary)'};
    border-color: ${({ $active }) => $active ? 'rgba(var(--accent-rgb), 0.35)' : 'var(--border)'};
  }
`;

export const PageEllipsis = styled.span`
  min-width: 1.6rem;
  height: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-muted);
`;

/** Chevron centrado abajo de todo, para volver a colapsar sin subir a buscar el título. */
export const CollapseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.4rem 0;
  margin-top: 0.5rem;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;

  &:hover {
    color: var(--accent);
  }
`;

export const EmptyState = styled.p`
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0;
`;
