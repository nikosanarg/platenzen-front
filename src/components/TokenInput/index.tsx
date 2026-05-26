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
  RevokeHint,
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
          Platenzen analiza tu historial de actividades y muestra métricas, récords y tendencias en un
          dashboard personal. Solo accede a tus propias actividades — sin almacenar información en
          servidores ni compartir nada con otros usuarios. Todo queda guardado únicamente en este dispositivo.
        </TokenSubtitle>

        <OAuthButton onClick={handleOAuth} as="button" type="button">
          Permitir en Strava
        </OAuthButton>
        <RevokeHint>
          Si querés revocar el acceso en cualquier momento, podés hacerlo desde{' '}
          <a href="https://www.strava.com/settings/apps" target="_blank" rel="noopener noreferrer">
            strava.com/settings/apps
          </a>
          .
        </RevokeHint>

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
              {' '}(necesitás tener cuenta en Strava y una app creada).
            </StepText>
          </Step>
          <Step>
            <StepNum>2</StepNum>
            <StepText>
              Bajá hasta <strong>"My API Application"</strong> y buscá <strong>"Your Refresh Token"</strong>.{' '}
              <strong>Importante:</strong> ese token solo funciona si autorizaste tu app con el permiso <code>activity:read_all</code>.
              Si lo copiás sin haber hecho eso, va a dar error de permisos.
            </StepText>
          </Step>
          <Step>
            <StepNum>3</StepNum>
            <StepText>
              Copiá el valor — es una cadena larga del estilo <code>f957a4a562...</code>
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
