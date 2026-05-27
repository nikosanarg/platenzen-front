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
  max-width: 440px;
  box-shadow: var(--shadow);
`;

export const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
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

export const OAuthButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  width: 100%;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.875rem 1.5rem;
  cursor: pointer;
  text-decoration: none;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 0 0 4px rgba(252, 76, 2, 0.35);
  }
`;

export const TokenError = styled.p`
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: var(--error);
  text-align: center;
`;

export const RevokeHint = styled.p`
  margin-top: 0.6rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.4;

  a {
    color: var(--text-muted);
    text-decoration: underline;
  }
`;
