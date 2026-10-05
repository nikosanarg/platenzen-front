import { NextRequest, NextResponse } from 'next/server';
import { isStravaMockMode } from '@/lib/authMode';
import {
  COOKIE_CLUB,
  DURACION_SESION_SEG,
  PATH_COOKIE_CLUB,
  configClub,
  firmarSesion,
  identidadDeAtleta,
} from '@/lib/club/servidor';

/**
 * Abre la sesión del club: le pregunta a Strava quién es el dueño del access
 * token y deja una cookie firmada con su identidad opaca. Es la única vez que
 * se consulta a Strava; después, cada pedido al club se resuelve con la cookie
 * (los límites de la API de Strava son por aplicación, no por usuario).
 *
 * El access token llega por `Authorization`, no por cookie: lo tiene el
 * cliente (ver regla 4 de AGENTS.md). El refresh token no se toca.
 */
export async function POST(request: NextRequest) {
  const config = configClub();
  if (!config) return NextResponse.json({ error: 'CLUB_NO_DISPONIBLE' }, { status: 503 });

  let atletaId: string;
  if (isStravaMockMode()) {
    // Sólo fuera de producción (`isStravaMockMode` lo garantiza): un atleta fijo para desarrollar.
    atletaId = 'mock';
  } else {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ error: 'SIN_TOKEN' }, { status: 401 });

    let res: Response;
    try {
      res = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
    } catch {
      return NextResponse.json({ error: 'STRAVA_NO_RESPONDE' }, { status: 503 });
    }
    if (res.status === 401) return NextResponse.json({ error: 'TOKEN_INVALIDO' }, { status: 401 });
    if (!res.ok) return NextResponse.json({ error: 'STRAVA_NO_RESPONDE' }, { status: 503 });

    const atleta = (await res.json()) as { id?: number };
    if (typeof atleta.id !== 'number') return NextResponse.json({ error: 'STRAVA_NO_RESPONDE' }, { status: 503 });
    // Del atleta sólo se usa el id, y sólo para derivar la identidad. Nombre, foto y ciudad no se leen.
    atletaId = String(atleta.id);
  }

  const identidad = identidadDeAtleta(atletaId, config.identidadSecret);
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(COOKIE_CLUB, firmarSesion(identidad, config.sesionSecret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: DURACION_SESION_SEG,
    path: PATH_COOKIE_CLUB,
  });
  return response;
}
