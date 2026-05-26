import styled from 'styled-components';

export const TokenContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  padding: 2rem;
`;

export const TokenCard = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 3rem;
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow);
`;

export const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
`;

export const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: var(--accent);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
`;

export const LogoText = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
`;

export const TokenTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

export const TokenSubtitle = styled.p`
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1.75rem;
  line-height: 1.5;
`;

export const TokenLabel = styled.label`
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
`;

export const TokenInput = styled.input`
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
  outline: none;
  transition: border-color 0.2s;
  font-family: monospace;

  &:focus {
    border-color: var(--accent);
  }

  &::placeholder {
    color: var(--text-muted);
  }
`;

export const TokenButton = styled.button<{ $loading?: boolean }>`
  width: 100%;
  margin-top: 1rem;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.875rem 1.5rem;
  cursor: ${({ $loading }) => ($loading ? 'not-allowed' : 'pointer')};
  opacity: ${({ $loading }) => ($loading ? 0.7 : 1)};
  transition: background 0.2s, opacity 0.2s;

  &:hover:not(:disabled) {
    background: var(--accent-hover);
  }
`;

export const TokenError = styled.p`
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: var(--error);
`;

export const TokenHint = styled.p`
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.5;

  a {
    color: var(--accent);
    text-decoration: underline;
    cursor: pointer;
  }
`;
