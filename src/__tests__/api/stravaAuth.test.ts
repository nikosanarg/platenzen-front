/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST as refresh } from '@/app/api/strava/refresh/route';
import { POST as disconnect } from '@/app/api/strava/disconnect/route';
import { GET as callback } from '@/app/api/strava/callback/route';

/**
 * Las rutas de servidor que sostienen la sesión de Strava.
 *
 * Lo que se fija acá es de seguridad, no de comodidad: que el refresh token no
 * salga nunca hacia el cliente, y que un fallo de red no se confunda con un
 * rechazo. Antes de este cambio el token vivía en `sessionStorage` y volvía al
 * servidor en el body de cada refresco; que eso no pueda volver a pasar es
 * justamente lo que estos tests protegen.
 *
 * Van en entorno `node` porque `next/server` necesita las Web APIs del
 * servidor, no las de jsdom.
 */

const RESPUESTA_STRAVA = {
  access_token: 'access-nuevo',
  refresh_token: 'refresh-rotado',
  expires_at: 1893456000,
  token_type: 'Bearer',
};

function respuesta(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Las cookies que la respuesta pide setear, por nombre. */
function cookiesDe(res: Response): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const raw of res.headers.getSetCookie()) {
    mapa.set(raw.split('=')[0], raw);
  }
  return mapa;
}

function pedidoDeRefresco(cookie?: string): NextRequest {
  return new NextRequest('https://platenzen.com/api/strava/refresh', {
    method: 'POST',
    headers: cookie ? { cookie } : undefined,
  });
}

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('POST /api/strava/refresh', () => {
  it('no le devuelve el refresh token al cliente', async () => {
    fetchMock.mockResolvedValue(respuesta(200, RESPUESTA_STRAVA));

    const res = await refresh(pedidoDeRefresco('strava_refresh=refresh-viejo'));
    const body = await res.json();

    expect(body).toEqual({ access_token: 'access-nuevo', expires_at: 1893456000 });
    expect(JSON.stringify(body)).not.toContain('refresh-rotado');
  });

  it('guarda el refresh token rotado en una cookie que el JS del cliente no puede leer', async () => {
    fetchMock.mockResolvedValue(respuesta(200, RESPUESTA_STRAVA));

    const cookie = cookiesDe(await refresh(pedidoDeRefresco('strava_refresh=refresh-viejo'))).get(
      'strava_refresh'
    );

    expect(cookie).toContain('refresh-rotado');
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/api\/strava/i);
  });

  it('ignora por completo el refresh token que venga en el body', async () => {
    fetchMock.mockResolvedValue(respuesta(200, RESPUESTA_STRAVA));

    const conBody = new NextRequest('https://platenzen.com/api/strava/refresh', {
      method: 'POST',
      headers: { cookie: 'strava_refresh=el-de-la-cookie', 'content-type': 'application/json' },
      body: JSON.stringify({ refresh_token: 'el-del-body' }),
    });

    await refresh(conBody);

    const enviado = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(enviado.refresh_token).toBe('el-de-la-cookie');
  });

  it('rechaza sin sesión cuando no hay cookie, sin salir a la red', async () => {
    const res = await refresh(pedidoDeRefresco());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'no_session' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cierra la sesión cuando Strava rechaza la autorización', async () => {
    fetchMock.mockResolvedValue(respuesta(400, { message: 'Bad Request' }));

    const res = await refresh(pedidoDeRefresco('strava_refresh=revocado'));
    const cookies = cookiesDe(res);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'reauthorize' });
    expect(cookies.get('strava_refresh')).toMatch(/Max-Age=0/i);
    expect(cookies.get('strava_connected')).toMatch(/Max-Age=0/i);
  });

  it('conserva la sesión cuando la red falla, porque nadie dijo que el token no sirva', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const res = await refresh(pedidoDeRefresco('strava_refresh=sigue-valido'));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'transient' });
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });

  it('conserva la sesión cuando Strava responde con un error de servidor', async () => {
    fetchMock.mockResolvedValue(respuesta(502));

    const res = await refresh(pedidoDeRefresco('strava_refresh=sigue-valido'));

    expect(res.status).toBe(503);
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });
});

describe('GET /api/strava/callback', () => {
  function pedidoDeCallback(query: string): NextRequest {
    return new NextRequest(`https://platenzen.com/api/strava/callback?${query}`);
  }

  it('guarda el refresh token sólo en la cookie httpOnly, nunca en la que el cliente lee', async () => {
    fetchMock.mockResolvedValue(respuesta(200, RESPUESTA_STRAVA));

    const cookies = cookiesDe(await callback(pedidoDeCallback('code=abc')));

    expect(cookies.get('strava_refresh')).toMatch(/HttpOnly/i);
    expect(cookies.get('strava_session')).not.toMatch(/HttpOnly/i);
    expect(decodeURIComponent(cookies.get('strava_session')!)).not.toContain('refresh-rotado');
  });

  it('deja una bandera legible para que el cliente sepa que hay sesión sin ver la cookie httpOnly', async () => {
    fetchMock.mockResolvedValue(respuesta(200, RESPUESTA_STRAVA));

    const bandera = cookiesDe(await callback(pedidoDeCallback('code=abc'))).get('strava_connected');

    expect(bandera).toBeDefined();
    expect(bandera).not.toMatch(/HttpOnly/i);
  });

  it('no setea ninguna cookie si el usuario rechazó la autorización', async () => {
    const res = await callback(pedidoDeCallback('error=access_denied'));

    expect(res.headers.get('location')).toContain('oauth_error=access_denied');
    expect(res.headers.getSetCookie()).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('no setea ninguna cookie si el intercambio con Strava falla', async () => {
    fetchMock.mockResolvedValue(respuesta(400, {}));

    const res = await callback(pedidoDeCallback('code=abc'));

    expect(res.headers.get('location')).toContain('oauth_error=exchange_failed');
    expect(res.headers.getSetCookie()).toHaveLength(0);
  });
});

describe('POST /api/strava/disconnect', () => {
  it('borra las dos cookies de sesión en sus paths respectivos', async () => {
    const res = await disconnect();
    const cookies = cookiesDe(res);

    expect(res.status).toBe(204);
    expect(cookies.get('strava_refresh')).toMatch(/Max-Age=0/i);
    expect(cookies.get('strava_refresh')).toMatch(/Path=\/api\/strava/i);
    expect(cookies.get('strava_connected')).toMatch(/Max-Age=0/i);
  });

  it('no llama a Strava: desconectar es local, revocar se hace desde strava.com', async () => {
    await disconnect();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
