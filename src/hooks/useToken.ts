'use client';

import { useState, useCallback, useRef } from 'react';

const TOKEN_KEY = 'platenzen_strava_token';
const REFRESH_BUFFER_SEC = 300; // refresh 5 min before expiry

export interface StoredToken {
  accessToken: string;
  expiresAt: number; // unix seconds
  createdAt: number; // ms
}

export type ResultadoRefresco =
  | { estado: 'ok'; token: StoredToken }
  | { estado: 'reautorizar' }
  | { estado: 'sin-red' };

function readStored(): StoredToken | null {
  if (typeof window === 'undefined') return null;
  try {
    // El formato viejo (con refreshToken) pudo quedar en sessionStorage de una
    // versión anterior de la app: esa credencial de larga vida no debe seguir
    // viva en el navegador, así que se limpia sin intentar reusarla.
    if (sessionStorage.getItem(TOKEN_KEY)) {
      sessionStorage.removeItem(TOKEN_KEY);
    }

    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredToken> & { refreshToken?: string };
    // Un valor guardado CON refreshToken es ahora el formato viejo: se
    // descarta en vez de usarlo a medias.
    if (parsed.refreshToken || !parsed.accessToken || !parsed.expiresAt) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return { accessToken: parsed.accessToken, expiresAt: parsed.expiresAt, createdAt: parsed.createdAt ?? Date.now() };
  } catch {
    return null;
  }
}

function writeStored(token: StoredToken): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
}

function clearStored(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

function isExpired(token: StoredToken): boolean {
  return Date.now() / 1000 > token.expiresAt - REFRESH_BUFFER_SEC;
}

function hasConnectedCookie(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  return /(?:^|;\s*)strava_connected=1(?:;|$)/.test(document.cookie);
}

async function refrescarToken(): Promise<ResultadoRefresco> {
  let res: Response;
  try {
    // Sin body: el refresh token vive en la cookie httpOnly, el servidor la
    // lee solo. Nada que el cliente mande acá se usaría.
    res = await fetch('/api/strava/refresh', { method: 'POST' });
  } catch {
    return { estado: 'sin-red' };
  }

  if (res.status === 401) {
    // Cubre tanto "no_session" (nunca hubo autorización, o ya se desconectó)
    // como "reauthorize" (Strava la revocó): en los dos casos el cliente
    // tiene que mostrar la pantalla de conexión.
    return { estado: 'reautorizar' };
  }

  if (!res.ok) {
    // 503 transient u otra falla: no forzar reautorización por un problema
    // que puede resolverse solo.
    return { estado: 'sin-red' };
  }

  const data = (await res.json()) as { access_token: string; expires_at: number };
  return {
    estado: 'ok',
    token: {
      accessToken: data.access_token,
      expiresAt: data.expires_at,
      createdAt: Date.now(),
    },
  };
}

export function useToken() {
  const [stored, setStored] = useState<StoredToken | null>(() => readStored());
  const refreshingRef = useRef<Promise<ResultadoRefresco> | null>(null);

  const saveToken = useCallback((token: StoredToken) => {
    writeStored(token);
    setStored(token);
  }, []);

  const clearToken = useCallback(async () => {
    clearStored();
    setStored(null);
    try {
      await fetch('/api/strava/disconnect', { method: 'POST' });
    } catch {
      // Best-effort: si la red falla acá no hay mucho más que hacer del lado
      // del cliente, y el storage local ya quedó limpio.
    }
  }, []);

  // Deduplicado: si dos llamadas concurrentes en la misma pestaña disparan un
  // refresco, la segunda usaría un refresh token que la primera ya rotó.
  const ejecutarRefresco = useCallback((): Promise<ResultadoRefresco> => {
    if (!refreshingRef.current) {
      refreshingRef.current = refrescarToken().then((resultado) => {
        refreshingRef.current = null;
        if (resultado.estado === 'ok') {
          writeStored(resultado.token);
          setStored(resultado.token);
        }
        return resultado;
      });
    }
    return refreshingRef.current;
  }, []);

  const getValidToken = useCallback(async (): Promise<string | null> => {
    const current = readStored();
    if (!current) return null;
    if (!isExpired(current)) return current.accessToken;

    const resultado = await ejecutarRefresco();
    return resultado.estado === 'ok' ? resultado.token.accessToken : null;
  }, [ejecutarRefresco]);

  return {
    token: stored?.accessToken ?? null,
    hasToken: stored !== null,
    // true si hay access token guardado o si existe la bandera legible
    // strava_connected: es lo que le permite a AppClient distinguir "nunca se
    // conectó" de "se conectó y sólo falta refrescar" al arrancar.
    hasSession: stored !== null || hasConnectedCookie(),
    saveToken,
    clearToken,
    getValidToken,
    refrescarSesion: ejecutarRefresco,
  };
}
