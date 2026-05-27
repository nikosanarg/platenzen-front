'use client';

import React from 'react';
import Image from 'next/image';
import {
  TokenContainer,
  TokenCard,
  LogoRow,
  LogoText,
  TokenTitle,
  TokenSubtitle,
  TokenError,
  OAuthButton,
  RevokeHint,
} from './styled';

interface TokenInputProps {
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

const TokenInput: React.FC<TokenInputProps> = ({ error }) => {
  const handleOAuth = () => {
    window.location.href = buildStravaAuthUrl();
  };

  return (
    <TokenContainer>
      <TokenCard>
        <LogoRow>
          <Image
            src="/assets/platenzen_logo.png"
            alt="Platenzen"
            width={40}
            height={40}
            style={{ borderRadius: '10px' }}
          />
          <LogoText>Platenzen</LogoText>
        </LogoRow>

        <TokenTitle>Tus estadísticas de Strava</TokenTitle>
        <TokenSubtitle>
          Platenzen analiza tu historial de actividades y muestra métricas, récords y tendencias en un
          dashboard personal. Solo accede a tus propias actividades — sin almacenar información en
          servidores ni compartir nada con otros usuarios. Todo queda guardado únicamente en este dispositivo.
        </TokenSubtitle>

        <OAuthButton onClick={handleOAuth} as="button" type="button">
          Conectar con
          <Image
            src="/assets/strava_logo.png"
            alt="Strava"
            width={80}
            height={24}
            style={{ height: '1.2em', width: 'auto', verticalAlign: 'middle' }}
          />
        </OAuthButton>

        {error && <TokenError>{error}</TokenError>}

        <RevokeHint>
          Si querés revocar el acceso en cualquier momento, podés hacerlo desde{' '}
          <a href="https://www.strava.com/settings/apps" target="_blank" rel="noopener noreferrer">
            strava.com/settings/apps
          </a>
          .
        </RevokeHint>
      </TokenCard>
    </TokenContainer>
  );
};

export default TokenInput;
