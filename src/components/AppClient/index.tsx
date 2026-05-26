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

async function bootstrapFromRefreshToken(refreshToken: string): Promise<StoredToken | null> {
  try {
    const res = await fetch('/api/strava/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as RefreshResponse;
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

  useEffect(() => {
    if (hasToken && status === 'idle' && !didInitLoad.current) {
      didInitLoad.current = true;
      fetch(getValidToken);
    }
  }, [hasToken, status, fetch, getValidToken]);

  const handleRefreshTokenSubmit = async (refreshToken: string) => {
    const stored = await bootstrapFromRefreshToken(refreshToken);
    if (!stored) return;
    saveToken(stored);
    fetch(() => Promise.resolve(stored.accessToken));
  };

  const handleRefresh = () => {
    refresh(getValidToken);
  };

  const handleLogout = () => {
    clearToken();
    didInitLoad.current = false;
  };

  const showTokenInput = !hasToken || status === 'error';

  if (showTokenInput) {
    return (
      <TokenInput
        onSubmit={handleRefreshTokenSubmit}
        error={status === 'error' ? error : null}
      />
    );
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
