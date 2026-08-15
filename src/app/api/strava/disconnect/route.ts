import { NextResponse } from 'next/server';

// Borra la sesión guardada del lado del servidor (la cookie httpOnly con el
// refresh token y la bandera legible). Esto NO revoca la autorización en
// Strava: eso lo hace el usuario desde strava.com/settings/apps (enlace ya
// presente en TokenInput). Sin esta ruta, la cookie httpOnly sobreviviría a
// un logout porque el cliente no puede borrarla por sí mismo.
export async function POST() {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set('strava_refresh', '', { maxAge: 0, path: '/api/strava' });
  response.cookies.set('strava_connected', '', { maxAge: 0, path: '/' });
  return response;
}
