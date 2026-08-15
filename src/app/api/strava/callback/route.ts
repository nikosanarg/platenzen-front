import { NextRequest, NextResponse } from 'next/server';

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  errors?: unknown;
}

const UN_ANIO_SEG = 60 * 60 * 24 * 365;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?oauth_error=access_denied`);
  }

  const res = await fetch('https://www.strava.com/api/v3/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    return NextResponse.redirect(`${origin}/?oauth_error=exchange_failed`);
  }

  const data = (await res.json()) as StravaTokenResponse;

  if (!data.access_token) {
    return NextResponse.redirect(`${origin}/?oauth_error=exchange_failed`);
  }

  const sessionPayload = JSON.stringify({
    access_token: data.access_token,
    expires_at: data.expires_at,
  });

  const secure = process.env.NODE_ENV === 'production';

  const response = NextResponse.redirect(`${origin}/`);

  // Credencial de larga vida: nunca al cliente, sólo la leen las rutas de servidor
  // que hablan con Strava (path acotado a /api/strava).
  response.cookies.set('strava_refresh', data.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: UN_ANIO_SEG,
    path: '/api/strava',
  });

  // Traspaso puntual y de corta vida del access token al cliente, como antes.
  response.cookies.set('strava_session', sessionPayload, {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    maxAge: 60,
    path: '/',
  });

  // Bandera legible, sin secretos: le permite al cliente saber que existe una
  // sesión (la cookie httpOnly) sin poder leerla.
  response.cookies.set('strava_connected', '1', {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    maxAge: UN_ANIO_SEG,
    path: '/',
  });

  return response;
}
