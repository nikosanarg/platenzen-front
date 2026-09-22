import styled from 'styled-components';

/**
 * Shell reused by every top-level card/section in the app: dark surface, no
 * border — the background against the page is what reads as the edge, a
 * border on top of that was redundant.
 */
export const Panel = styled.div`
  background: var(--bg-card);
  border-radius: var(--radius);
`;
