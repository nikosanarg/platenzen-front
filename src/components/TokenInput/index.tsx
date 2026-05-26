'use client';

import React, { useState } from 'react';
import {
  TokenContainer,
  TokenCard,
  LogoRow,
  LogoIcon,
  LogoText,
  TokenTitle,
  TokenSubtitle,
  TokenLabel,
  TokenInput as StyledInput,
  TokenButton,
  TokenError,
  TokenHint,
} from './styled';

interface TokenInputProps {
  onSubmit: (refreshToken: string) => Promise<void>;
  error?: string | null;
}

const TokenInput: React.FC<TokenInputProps> = ({ onSubmit, error }) => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    await onSubmit(trimmed);
    setLoading(false);
  };

  return (
    <TokenContainer>
      <TokenCard>
        <LogoRow>
          <LogoIcon>🏃</LogoIcon>
          <LogoText>Platenzen</LogoText>
        </LogoRow>
        <TokenTitle>Conectá tu cuenta de Strava</TokenTitle>
        <TokenSubtitle>
          Ingresá tu <strong>refresh token</strong> de Strava. Solo necesitás hacerlo una vez — el acceso se renueva automáticamente.
        </TokenSubtitle>
        <form onSubmit={handleSubmit}>
          <TokenLabel htmlFor="token-input">Refresh Token</TokenLabel>
          <StyledInput
            id="token-input"
            type="text"
            placeholder="f957a4a5626625f8def2222b6a0df4aa..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {error && <TokenError>{error}</TokenError>}
          <TokenButton type="submit" $loading={loading} disabled={loading || !value.trim()}>
            {loading ? 'Verificando token...' : 'Continuar'}
          </TokenButton>
        </form>
        <TokenHint>
          Obtené el refresh token haciendo el flujo OAuth una vez. El token se guarda localmente en tu navegador y se renueva solo antes de expirar.
        </TokenHint>
      </TokenCard>
    </TokenContainer>
  );
};

export default TokenInput;
