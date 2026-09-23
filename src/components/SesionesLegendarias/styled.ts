import styled from 'styled-components';
import { Panel } from '@/components/Panel';

export const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

/** Una lista, no una grilla: vive en la sidebar junto a Récords. */
export const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const SessionReason = styled.div`
  font-size: 0.66rem;
  font-weight: 600;
  color: var(--gold-muted);
`;

/** El emoji del logro (🥇⚡🎯🚀) como `leftVisual`: tamaño propio, más grande que el texto. */
export const SessionIcon = styled.span`
  font-size: 1.4rem;
  line-height: 1;
`;

export const EmptyState = styled(Panel)`
  padding: 1.25rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.8rem;
  box-shadow: var(--shadow-sm);
`;
