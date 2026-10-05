import styled, { css } from 'styled-components';
import { Panel } from '@/components/Panel';

export const Root = styled(Panel)`
  padding: 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 600px) {
    padding: 1.25rem 1rem;
  }
`;

export const Intro = styled.p`
  margin-top: -0.75rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
`;

export const Notice = styled.p`
  font-size: 0.8rem;
  color: var(--text-muted);
  padding: 0.6rem 0.8rem;
  border-radius: var(--radius);
  background: var(--bg-secondary);
`;

export const LigaSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.5rem;
`;

export const LigaHead = styled.h3`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: inherit;
  font-weight: inherit;
`;

export const LigaCriterio = styled.span`
  font-size: 0.75rem;
  color: var(--text-muted);
`;

export const EmptyLiga = styled.p`
  font-size: 0.8rem;
  color: var(--text-muted);
`;

/** Scroll propio si la tabla no entra: nunca el de la página. */
export const TableWrap = styled.div`
  overflow-x: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

/** La racha ya está implícita en la liga: es la primera columna que cede en un teléfono. */
const celda = css<{ $num?: boolean; $optional?: boolean }>`
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid var(--border);
  text-align: ${({ $num }) => ($num ? 'right' : 'left')};
  white-space: nowrap;

  ${({ $optional }) =>
    $optional &&
    css`
      @media (max-width: 500px) {
        display: none;
      }
    `}
`;

export const Th = styled.th<{ $num?: boolean; $optional?: boolean }>`
  ${celda}
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-muted);
  background: var(--bg-secondary);
`;

export const Td = styled.td<{ $num?: boolean; $optional?: boolean }>`
  ${celda}
  font-size: 0.85rem;
  color: var(--text-primary);
  font-family: ${({ $num }) => ($num ? 'var(--font-num)' : 'var(--font)')};
`;

export const NameButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: var(--accent);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

/** La fila propia se distingue por fondo y por texto: el color solo no la nombra. */
export const Fila = styled.tr<{ $propia: boolean }>`
  background: ${({ $propia }) => ($propia ? 'var(--accent-muted)' : 'transparent')};
`;

export const Propia = styled.span`
  font-size: 0.75rem;
  color: var(--text-muted);
`;

export const EstadoModal = styled.p`
  padding: 2rem 0;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-muted);
`;

export const Cta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 1rem;
  border-radius: var(--radius);
  background: var(--accent-muted);
  border: 1px solid rgba(var(--accent-rgb), 0.35);
  font-size: 0.85rem;
  color: var(--text-secondary);

  a {
    color: var(--accent);
    font-weight: 600;
  }
`;
