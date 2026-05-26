import { NextRequest, NextResponse } from 'next/server';

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export async function POST(request: NextRequest) {
  const { refresh_token } = (await request.json()) as { refresh_token: string };

  if (!refresh_token) {
    return NextResponse.json({ error: 'missing_refresh_token' }, { status: 400 });
  }

  const res = await fetch('https://www.strava.com/api/v3/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'refresh_failed' }, { status: 401 });
  }

  const data = (await res.json()) as StravaTokenResponse;

  return NextResponse.json({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  });
}
