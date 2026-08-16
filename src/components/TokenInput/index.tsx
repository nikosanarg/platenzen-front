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
  OAuthButtonOff,
  ProviderStack,
  ProviderWordmark,
  ProviderNote,
  InstallRow,
  RevokeHint,
} from './styled';
import { InstallInlineButton } from '@/components/pwa/styled';
import { useBotonInstalacionInline } from '@/components/pwa/useInstalacionPWA';
import { IconDownload } from '@/components/Icon';

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

/**
 * Pantalla de conexión.
 *
 * Muestra los dos proveedores que Platenzen sabe leer, aunque Garmin todavía no
 * se pueda conectar: el adapter existe (`src/services/providers/garmin/`) y el
 * dominio ya trata sus actividades igual que las de Strava — lo que falta es
 * acceso al programa de desarrolladores de Garmin, que es sólo para empresas y
 * con aprobación. Ver `docs/matriz-proveedores.md`.
 *
 * El botón apagado se declara acá y no se esconde: que el producto lea de más
 * de una fuente es parte de lo que es, y una opción visible pero apagada dice
 * más que una ausencia. Lo que no se hace es fingir que anda — el motivo está
 * escrito abajo, no en un tooltip que hay que descubrir.
 *
 * La marca de Garmin va como texto porque no hay asset en el repo; con el
 * logo oficial, se reemplaza por un `<Image>` como el de Strava.
 */
const TokenInput: React.FC<TokenInputProps> = ({ error }) => {
  const { sePuedeInstalar, instalar } = useBotonInstalacionInline();

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

        <TokenTitle>Tus estadísticas de running</TokenTitle>
        <TokenSubtitle>
          Conectá tu cuenta y Platenzen analiza tu historial de actividades para mostrar métricas,
          récords y tendencias en un dashboard personal. Solo accede a tus propias actividades — sin
          almacenar información en servidores ni compartir nada con otros usuarios. Todo queda
          guardado únicamente en este dispositivo.
        </TokenSubtitle>

        <ProviderStack>
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

          <OAuthButtonOff
            as="button"
            type="button"
            aria-disabled="true"
            aria-describedby="garmin-nota"
            onClick={(e: React.MouseEvent) => e.preventDefault()}
          >
            Conectar con <ProviderWordmark>GARMIN</ProviderWordmark>
          </OAuthButtonOff>
        </ProviderStack>

        <ProviderNote id="garmin-nota">
          Garmin todavía no está habilitado: su API requiere una aprobación que está pendiente. Las
          actividades de Garmin se leen igual que las de Strava, así que el dashboard va a funcionar
          igual el día que se active.
        </ProviderNote>

        {sePuedeInstalar && (
          <InstallRow>
            <InstallInlineButton onClick={instalar} type="button">
              <IconDownload size={18} />
              Instalar Platenzen como app
            </InstallInlineButton>
          </InstallRow>
        )}

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
