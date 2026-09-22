import styled from 'styled-components';
import { Panel } from '@/components/Panel';

/**
 * Antes era un divisor suelto (`border-top`) sobre el fondo semitransparente
 * de la página: legible cuando el fondo era liso, ilegible con la foto
 * detrás. `Panel` le da la misma superficie opaca que el resto de las cards.
 */
export const SectionRoot = styled(Panel)`
  margin-top: 1.25rem;
  padding: 1.25rem 1.5rem;
`;

export const InsightList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-top: 0.75rem;
`;

export const InsightItem = styled.li`
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
  padding-left: 1rem;
  position: relative;

  &::before {
    content: '·';
    position: absolute;
    left: 0;
    color: var(--text-muted);
    font-weight: 700;
  }
`;
