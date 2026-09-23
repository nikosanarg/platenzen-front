import styled from 'styled-components';
import { Panel, glassHover } from '@/components/Panel';

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

export const SessionRow = styled.a`
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: var(--bg-card);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: 0.55rem 1.6rem 0.55rem 0.85rem;
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  transition: background 0.15s, border-color 0.15s, backdrop-filter 0.15s;

  ${glassHover('var(--gold-rgb)')}
`;

export const SessionName = styled.div`
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--gold);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SessionMeta = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.72rem;
  color: var(--text-secondary);
`;

export const SessionReason = styled.div`
  font-size: 0.66rem;
  font-weight: 600;
  color: var(--gold-muted);
`;

export const EmptyState = styled(Panel)`
  padding: 1.25rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.8rem;
  box-shadow: var(--shadow-sm);
`;
