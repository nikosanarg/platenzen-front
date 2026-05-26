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
  OAuthButton,
  Divider,
  DividerText,
  StepsBox,
  Step,
  StepNum,
  StepText,
} from './styled';

interface TokenInputProps {
  onSubmit: (refreshToken: string) => Promise<void>;
  error?: string | null;
}

function buildStravaAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const redirectUri = `${window.location.origin}/api/strava/callback`;
  const params = new URLSearchParams({
    client_id: clientId ?? '',
    response_type: 'code',
    redirect_uri: redirectUri,
    approval_prompt: 'auto',
    scope: 'read,activity:read_all',
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
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

  const handleOAuth = () => {
    window.location.href = buildStravaAuthUrl();
  };

  return (
    <TokenContainer>
      <TokenCard>
        <LogoRow>
          <LogoIcon>P</LogoIcon>
          <LogoText>Platenzen</LogoText>
        </LogoRow>

        <TokenTitle>Tus estadísticas de Strava</TokenTitle>
        <TokenSubtitle>
          Platenzen analiza tu historial de actividades — distancia, ritmo, rachas, récords — y lo muestra
          en un dashboard personal. Nada se sube a ningún servidor: todo queda guardado en este dispositivo.
        </TokenSubtitle>

        <OAuthButton onClick={handleOAuth} as="button" type="button">
          Conectar con Strava
        </OAuthButton>

        <Divider>
          <DividerText>Si el botón no funciona, seguí estos pasos</DividerText>
        </Divider>

        <StepsBox>
          <Step>
            <StepNum>1</StepNum>
            <StepText>
              Entrá a{' '}
              <a href="https://www.strava.com/settings/api" target="_blank" rel="noopener noreferrer">
                strava.com/settings/api
              </a>
              {' '}(necesitás tener cuenta en Strava).
            </StepText>
          </Step>
          <Step>
            <StepNum>2</StepNum>
            <StepText>
              En esa página buscá la sección llamada <strong>"Tu token de actualización"</strong> (o <em>Your Refresh Token</em> si está en inglés).
            </StepText>
          </Step>
          <Step>
            <StepNum>3</StepNum>
            <StepText>
              Copiá el valor que aparece debajo — es una cadena larga de letras y números,
              del estilo <code>f957a4a562...</code>
            </StepText>
          </Step>
          <Step>
            <StepNum>4</StepNum>
            <StepText>
              Pegalo en el campo de abajo y hacé click en <strong>Continuar</strong>.
            </StepText>
          </Step>
        </StepsBox>

        <form onSubmit={handleSubmit}>
          <TokenLabel htmlFor="token-input">Refresh Token</TokenLabel>
          <StyledInput
            id="token-input"
            type="text"
            placeholder="f957a4a5626625f8def2222b6a0df4aa0b48b03f"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {error && <TokenError>{error}</TokenError>}
          <TokenButton type="submit" $loading={loading} disabled={loading || !value.trim()}>
            {loading ? 'Verificando...' : 'Continuar'}
          </TokenButton>
        </form>
      </TokenCard>
    </TokenContainer>
  );
};

export default TokenInput;
