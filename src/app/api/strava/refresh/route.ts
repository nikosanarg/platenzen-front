import { NextRequest, NextResponse } from 'next/server';

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

const UN_ANIO_SEG = 60 * 60 * 24 * 365;

function borrarSesion(response: NextResponse): void {
  response.cookies.set('strava_refresh', '', { maxAge: 0, path: '/api/strava' });
  response.cookies.set('strava_connected', '', { maxAge: 0, path: '/' });
}

export async function POST(request: NextRequest) {
  // El refresh token viaja sólo por la cookie httpOnly. No se lee el body del
  // cliente: aceptarlo de ahí sería reabrir la vía que esta ruta existe para cerrar.
  const refreshToken = request.cookies.get('strava_refresh')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'no_session' }, { status: 401 });
  }

  let res: Response;
  try {
    res = await fetch('https://www.strava.com/api/v3/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
  } catch {
    // No hubo respuesta de Strava: problema transitorio, no un rechazo. No se
    // toca la cookie.
    return NextResponse.json({ error: 'transient' }, { status: 503 });
  }

  if (res.status === 400 || res.status === 401) {
    // Strava dijo que no: la autorización fue revocada o el refresh token ya
    // no sirve. Ahí sí se cierra la sesión local.
    const response = NextResponse.json({ error: 'reauthorize' }, { status: 401 });
    borrarSesion(response);
    return response;
  }

  if (!res.ok) {
    // Cualquier otro fallo (5xx, etc.) es transitorio: no se descarta una
    // credencial que sigue siendo válida.
    return NextResponse.json({ error: 'transient' }, { status: 503 });
  }

  const data = (await res.json()) as StravaTokenResponse;

  const secure = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({
    access_token: data.access_token,
    expires_at: data.expires_at,
  });

  // Strava rota el refresh token en cada uso: el viejo queda invalidado.
  response.cookies.set('strava_refresh', data.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: UN_ANIO_SEG,
    path: '/api/strava',
  });

  return response;
}
