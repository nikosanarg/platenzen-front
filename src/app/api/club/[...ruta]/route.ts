import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_CLUB, configClub, leerSesion, llamarApi } from '@/lib/club/servidor';

/**
 * Proxy hacia platenzen-api. Sólo deja pasar las rutas que el front usa — no
 * es un túnel genérico: una ruta nueva de la API no queda expuesta por estar.
 *
 * - `corredores/me...` exige la cookie del club: la identidad sale de ahí y
 *   nunca del pedido del navegador.
 * - `ranking` y `corredores/<clave>` (id, usuario o alias) son públicas; si hay cookie, la identidad
 *   viaja sólo para que la tabla marque la fila propia.
 */

type Contexto = { params: Promise<{ ruta: string[] }> };

/** Un id, un usuario o un alias: lo que puede ir en `/hero/<clave>`. Nunca `me`. */
const RE_CLAVE = /^[a-z0-9._-]{3,36}$/i;

/** Qué métodos admite cada ruta, y si exige sesión. */
function permitido(ruta: string[], metodo: string): { privada: boolean } | null {
  const [a, b, c] = ruta;
  if (a === 'ranking' && ruta.length === 1 && metodo === 'GET') return { privada: false };
  if (a !== 'corredores') return null;
  if (b === 'me' && ruta.length === 2 && ['GET', 'POST', 'PATCH', 'DELETE'].includes(metodo)) return { privada: true };
  if (b === 'me' && c === 'acuerdos' && ruta.length === 3 && metodo === 'POST') return { privada: true };
  if (b === 'me' && c === 'publicacion' && ruta.length === 3 && metodo === 'PUT') return { privada: true };
  if (b && b !== 'me' && RE_CLAVE.test(b) && ruta.length === 2 && metodo === 'GET') return { privada: false };
  return null;
}

async function reenviar(request: NextRequest, { params }: Contexto): Promise<Response> {
  const { ruta } = await params;
  const regla = permitido(ruta, request.method);
  if (!regla) return NextResponse.json({ error: 'NO_ENCONTRADO' }, { status: 404 });

  const config = configClub();
  if (!config) return NextResponse.json({ error: 'CLUB_NO_DISPONIBLE' }, { status: 503 });

  const identidad = leerSesion(request.cookies.get(COOKIE_CLUB)?.value, config.sesionSecret);
  if (regla.privada && !identidad) return NextResponse.json({ error: 'SIN_SESION' }, { status: 401 });

  const body = ['POST', 'PATCH', 'PUT'].includes(request.method) ? await request.text() : undefined;
  const query = request.nextUrl.search;

  let res: Response;
  try {
    res = await llamarApi(config, `/${ruta.join('/')}${query}`, { method: request.method, body, identidad });
  } catch {
    return NextResponse.json({ error: 'CLUB_NO_DISPONIBLE' }, { status: 503 });
  }

  // La API distingue "faltan secretos" (503) de un 401 de cliente: un 401 de
  // la API acá es configuración rota entre los dos servidores, no algo del usuario.
  if (res.status === 401 || res.status === 503) {
    return NextResponse.json({ error: 'CLUB_NO_DISPONIBLE' }, { status: 503 });
  }

  if (res.status === 204) return new NextResponse(null, { status: 204 });
  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export const GET = reenviar;
export const POST = reenviar;
export const PATCH = reenviar;
export const PUT = reenviar;
export const DELETE = reenviar;
