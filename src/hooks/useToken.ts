'use client';

import { useState, useCallback, useRef } from 'react';

const TOKEN_KEY = 'platenzen_strava_token';
const REFRESH_BUFFER_SEC = 300; // refresh 5 min before expiry

export interface StoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix seconds
  createdAt: number; // ms
}

function readStored(): StoredToken | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredToken>;
    // Discard tokens from the old format (missing refreshToken or expiresAt)
    if (!parsed.refreshToken || !parsed.expiresAt) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return parsed as StoredToken;
  } catch {
    return null;
  }
}

function writeStored(token: StoredToken): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
}

function isExpired(token: StoredToken): boolean {
  return Date.now() / 1000 > token.expiresAt - REFRESH_BUFFER_SEC;
}

async function refreshToken(refreshToken: string): Promise<StoredToken | null> {
  try {
    const res = await fetch('/api/strava/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string; refresh_token: string; expires_at: number };
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

export function useToken() {
  const [stored, setStored] = useState<StoredToken | null>(() => readStored());
  const refreshingRef = useRef<Promise<StoredToken | null> | null>(null);

  const saveToken = useCallback((token: StoredToken) => {
    writeStored(token);
    setStored(token);
  }, []);

  const clearToken = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setStored(null);
  }, []);

  const getValidToken = useCallback(async (): Promise<string | null> => {
    const current = readStored();
    if (!current) return null;

    if (!isExpired(current)) return current.accessToken;

    // Deduplicate concurrent refresh calls
    if (!refreshingRef.current) {
      refreshingRef.current = refreshToken(current.refreshToken).then((refreshed) => {
        refreshingRef.current = null;
        if (refreshed) {
          writeStored(refreshed);
          setStored(refreshed);
        }
        return refreshed;
      });
    }

    const refreshed = await refreshingRef.current;
    return refreshed?.accessToken ?? null;
  }, []);

  return {
    token: stored?.accessToken ?? null,
    hasToken: stored !== null,
    saveToken,
    clearToken,
    getValidToken,
  };
}
