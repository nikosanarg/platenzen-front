import { NextRequest, NextResponse } from 'next/server';

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  errors?: unknown;
}

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

  const payload = JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  });

  const response = NextResponse.redirect(`${origin}/`);
  response.cookies.set('strava_oauth', payload, {
    httpOnly: false,
    maxAge: 60,
    sameSite: 'lax',
    path: '/',
  });
  return response;
}
