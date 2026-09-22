import styled, { keyframes } from 'styled-components';
import { Panel } from '@/components/Panel';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(6, 8, 12, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  z-index: 100;
  animation: ${fadeIn} 0.15s ease-out;
`;

export const Panel_ = styled(Panel)<{ $maxWidth: string }>`
  width: 100%;
  max-width: ${({ $maxWidth }) => $maxWidth};
  max-height: calc(100vh - 2.5rem);
  overflow-y: auto;
  padding: 0;
  animation: ${slideIn} 0.18s ease-out;
`;

export const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.15rem 1.25rem;
  border-bottom: 1px solid var(--border);
`;

export const Title = styled.h2`
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
`;

export const CloseBtn = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    color: var(--text-primary);
    border-color: var(--text-muted);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

export const Body = styled.div`
  padding: 1.25rem;
`;
