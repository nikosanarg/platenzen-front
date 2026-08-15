'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useToken, StoredToken } from '@/hooks/useToken';
import { useActivities } from '@/hooks/useActivities';
import { StravaDataProvider } from '@/hooks/useStravaData';
import { computeStats } from '@/lib/stats';
import TokenInput from '@/components/TokenInput';
import Dashboard from '@/components/Dashboard';
import {
  TokenContainer,
  TokenCard,
  LogoRow,
  LogoText,
  TokenTitle,
  TokenSubtitle,
  OAuthButton,
} from '@/components/TokenInput/styled';

interface SessionCookiePayload {
  access_token: string;
  expires_at: number;
}

function readAndClearOAuthCookie(): StoredToken | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)strava_session=([^;]+)/);
    if (!match) return null;
    const data = JSON.parse(decodeURIComponent(match[1])) as SessionCookiePayload;
    document.cookie = 'strava_session=; max-age=0; path=/';
    if (!data.access_token) return null;
    return {
      accessToken: data.access_token,
      expiresAt: data.expires_at,
      createdAt: Date.now(),
    };
  } catch {
    return null;
  }
}

const AppClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  // Sesión sin access token guardado, pero con bandera strava_connected:
  // se intenta un refresco antes de mostrar la pantalla de conexión.
  const [reconectando, setReconectando] = useState(false);
  const [redCaida, setRedCaida] = useState(false);
  const { hasToken, hasSession, saveToken, clearToken, getValidToken, refrescarSesion } = useToken();
  const { activities, status, error, loadingCount, isFromCache, cacheAge, fetch, refresh } = useActivities();
  const didInitLoad = useRef(false);

  // Handle OAuth callback: read short-lived cookie set by /api/strava/callback
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const fromOAuth = readAndClearOAuthCookie();
    if (fromOAuth) {
      saveToken(fromOAuth);
      didInitLoad.current = true;
      fetch(() => Promise.resolve(fromOAuth.accessToken));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (didInitLoad.current || status !== 'idle') return;

    if (hasToken) {
      didInitLoad.current = true;
      fetch(getValidToken);
      return;
    }

    // No hay access token en localStorage, pero la bandera strava_connected
    // dice que puede haber una sesión viva del lado del servidor (la cookie
    // httpOnly con el refresh token). Se intenta antes de rendirse: si sale
    // bien, el usuario nunca ve la pantalla de conexión.
    if (hasSession && !reconectando && !redCaida) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReconectando(true);
      refrescarSesion().then((resultado) => {
        if (resultado.estado === 'ok') {
          didInitLoad.current = true;
          fetch(() => Promise.resolve(resultado.token.accessToken));
        } else if (resultado.estado === 'sin-red') {
          // La sesión sigue siendo válida: esto no es "hay que reautorizar",
          // es "no se pudo preguntar". Mostrar el error de conexión, no la
          // pantalla de conectar con Strava.
          setRedCaida(true);
        }
        // estado 'reautorizar': no hay nada que hacer acá — el servidor ya
        // borró strava_connected, así que hasSession pasa a false y el
        // render cae solo a la pantalla de conexión.
        setReconectando(false);
      });
    }
  }, [hasToken, hasSession, status, fetch, getValidToken, refrescarSesion, reconectando, redCaida]);

  const handleRefresh = () => {
    refresh(getValidToken);
  };

  const handleLogout = () => {
    void clearToken();
    didInitLoad.current = false;
  };

  // Surface OAuth errors from URL param
  const oauthError = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('oauth_error')
    : null;

  // Clear stored token when the access token is missing the required scope —
  // the saved refresh token can't be upgraded, user needs to re-authorize via OAuth.
  useEffect(() => {
    if (status === 'error' && error === 'scope_missing') {
      void clearToken();
      didInitLoad.current = false;
    }
  }, [status, error, clearToken]);

  if (!mounted) return null;

  if (redCaida) {
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
          <TokenTitle>Sin conexión</TokenTitle>
          <TokenSubtitle>
            No se pudo confirmar la sesión con Strava por un problema de red. La sesión
            guardada sigue siendo válida — reintentá cuando vuelva la conexión.
          </TokenSubtitle>
          <OAuthButton as="button" type="button" onClick={() => setRedCaida(false)}>
            Reintentar
          </OAuthButton>
        </TokenCard>
      </TokenContainer>
    );
  }

  const showTokenInput = (!hasToken && !hasSession && !reconectando) || status === 'error';

  if (showTokenInput) {
    const errorMsg = oauthError
      ? 'La autorización con Strava fue rechazada o falló. Intentá de nuevo.'
      : error === 'scope_missing'
        ? 'El token no tiene permiso para leer actividades. Usá el botón para conectar con Strava nuevamente.'
        : status === 'error' ? error : null;
    return <TokenInput error={errorMsg} />;
  }

  const stats = status === 'success' ? computeStats(activities) : null;

  return (
    <StravaDataProvider value={{ activities, stats: stats ?? computeStats([]) }}>
      <Dashboard
        loading={reconectando || status === 'loading' || status === 'idle'}
        loadingCount={loadingCount}
        isFromCache={isFromCache}
        cacheAge={cacheAge}
        onRefresh={handleRefresh}
        onLogout={handleLogout}
      >
        {children}
      </Dashboard>
    </StravaDataProvider>
  );
};

export default AppClient;
