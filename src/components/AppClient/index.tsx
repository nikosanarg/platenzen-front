'use client';

import React, { useEffect, useRef } from 'react';
import { useToken, StoredToken } from '@/hooks/useToken';
import { useActivities } from '@/hooks/useActivities';
import { computeStats } from '@/lib/stats';
import TokenInput from '@/components/TokenInput';
import Dashboard from '@/components/Dashboard';

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

function readAndClearOAuthCookie(): StoredToken | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)strava_oauth=([^;]+)/);
    if (!match) return null;
    const data = JSON.parse(decodeURIComponent(match[1])) as RefreshResponse;
    document.cookie = 'strava_oauth=; max-age=0; path=/';
    if (!data.access_token || !data.refresh_token) return null;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      createdAt: Date.now(),
    };
  } catch {
    return null;
  }
}

const AppClient: React.FC = () => {
  const { hasToken, saveToken, clearToken, getValidToken } = useToken();
  const { activities, status, error, loadingCount, isFromCache, cacheAge, fetch, refresh } = useActivities();
  const didInitLoad = useRef(false);

  // Handle OAuth callback: read short-lived cookie set by /api/strava/callback
  useEffect(() => {
    const fromOAuth = readAndClearOAuthCookie();
    if (fromOAuth) {
      saveToken(fromOAuth);
      didInitLoad.current = true;
      fetch(() => Promise.resolve(fromOAuth.accessToken));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasToken && status === 'idle' && !didInitLoad.current) {
      didInitLoad.current = true;
      fetch(getValidToken);
    }
  }, [hasToken, status, fetch, getValidToken]);

  const handleRefresh = () => {
    refresh(getValidToken);
  };

  const handleLogout = () => {
    clearToken();
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
      clearToken();
      didInitLoad.current = false;
    }
  }, [status, error, clearToken]);

  const showTokenInput = !hasToken || status === 'error';

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
    <Dashboard
      activities={activities}
      stats={stats ?? computeStats([])}
      loading={status === 'loading' || status === 'idle'}
      loadingCount={loadingCount}
      isFromCache={isFromCache}
      cacheAge={cacheAge}
      onRefresh={handleRefresh}
      onLogout={handleLogout}
    />
  );
};

export default AppClient;
