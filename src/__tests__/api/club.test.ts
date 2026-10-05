/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST as abrirSesion } from '@/app/api/club/sesion/route';
import { GET, POST, PUT } from '@/app/api/club/[...ruta]/route';
import { firmarSesion, identidadDeAtleta, leerSesion } from '@/lib/club/servidor';

/**
 * Las rutas de servidor del club. Lo que protegen es la identidad: que la API
 * reciba siempre la del dueño de la cookie y nunca una que mande el navegador,
 * que el id de Strava no salga del servidor, y que el proxy no sea un túnel
 * abierto hacia cualquier ruta de la API.
 */

const ENV = {
  PLATENZEN_API_URL: 'http://api.test',
  PLATENZEN_SERVER_SECRET: 'secreto-servidor',
  PLATENZEN_IDENTIDAD_SECRET: 'secreto-identidad',
  CLUB_SESION_SECRET: 'secreto-sesion',
};

const fetchMock = jest.fn();
const original = { ...process.env };

beforeEach(() => {
  Object.assign(process.env, ENV);
  delete process.env.NEXT_PUBLIC_STRAVA_AUTH_MODE;
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  process.env = { ...original };
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const ctx = (...ruta: string[]) => ({ params: Promise.resolve({ ruta }) });

function pedido(url: string, init: { method?: string; cookie?: string; body?: string; headers?: Record<string, string> } = {}) {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set('cookie', `pz_club=${init.cookie}`);
  return new NextRequest(`http://localhost${url}`, { method: init.method ?? 'GET', headers, body: init.body });
}

const IDENTIDAD = identidadDeAtleta('12345', ENV.PLATENZEN_IDENTIDAD_SECRET);

describe('sesión firmada', () => {
  it('la identidad es estable para un atleta y distinta entre atletas', () => {
    expect(identidadDeAtleta('12345', 's')).toBe(identidadDeAtleta('12345', 's'));
    expect(identidadDeAtleta('12345', 's')).not.toBe(identidadDeAtleta('12346', 's'));
    expect(identidadDeAtleta('12345', 's')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('una cookie válida devuelve su identidad', () => {
    expect(leerSesion(firmarSesion(IDENTIDAD, 'k', 1000), 'k', 1001)).toBe(IDENTIDAD);
  });

  it('una cookie alterada, firmada con otro secreto o vencida no vale', () => {
    const cookie = firmarSesion(IDENTIDAD, 'k', 1000);
    const otraIdentidad = cookie.replace(IDENTIDAD, 'f'.repeat(64));
    expect(leerSesion(otraIdentidad, 'k', 1001)).toBeNull();
    expect(leerSesion(cookie, 'otro', 1001)).toBeNull();
    expect(leerSesion(cookie, 'k', 1000 + 60 * 60 * 24 * 31)).toBeNull();
    expect(leerSesion('basura', 'k')).toBeNull();
  });
});

describe('POST /api/club/sesion', () => {
  it('sin configuración del club responde 503 y no llama a Strava', async () => {
    delete process.env.CLUB_SESION_SECRET;
    const res = await abrirSesion(pedido('/api/club/sesion', { method: 'POST' }));
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pregunta a Strava quién es y deja una cookie httpOnly con la identidad, no con el id', async () => {
    fetchMock.mockResolvedValue(json(200, { id: 12345, firstname: 'Ana', city: 'Rosario' }));
    const res = await abrirSesion(
      pedido('/api/club/sesion', { method: 'POST', headers: { authorization: 'Bearer tok' } })
    );

    expect(fetchMock).toHaveBeenCalledWith('https://www.strava.com/api/v3/athlete', expect.anything());
    expect(res.status).toBe(204);
    const cookie = res.headers.getSetCookie().find(c => c.startsWith('pz_club='))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/api\/club/i);
    expect(cookie).toContain(IDENTIDAD);
    expect(cookie).not.toContain('12345');
  });

  it('un token rechazado por Strava es 401, no una sesión', async () => {
    fetchMock.mockResolvedValue(json(401, {}));
    const res = await abrirSesion(
      pedido('/api/club/sesion', { method: 'POST', headers: { authorization: 'Bearer viejo' } })
    );
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie()).toEqual([]);
  });
});

describe('proxy /api/club/*', () => {
  const cookie = () => firmarSesion(IDENTIDAD, ENV.CLUB_SESION_SECRET);

  it('una ruta que el front no usa no se reenvía', async () => {
    const res = await GET(pedido('/api/club/corredores'), ctx('corredores'));
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('la ficha pública se pide por usuario, sin sesión', async () => {
    fetchMock.mockResolvedValue(json(200, { data: {} }));
    const res = await GET(pedido('/api/club/corredores/nsande'), ctx('corredores', 'nsande'));
    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/corredores/nsande');
  });

  it('una clave con caracteres raros no se reenvía', async () => {
    const res = await GET(pedido('/api/club/corredores/a%20b'), ctx('corredores', 'a b'));
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('las rutas /me exigen la cookie del club', async () => {
    const res = await GET(pedido('/api/club/corredores/me'), ctx('corredores', 'me'));
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('la identidad sale de la cookie, nunca de lo que mande el navegador', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await PUT(
      pedido('/api/club/corredores/me/publicacion', {
        method: 'PUT',
        cookie: cookie(),
        body: '{}',
        headers: { 'x-corredor-identidad': 'a'.repeat(64), 'x-platenzen-secret': 'inventado' },
      }),
      ctx('corredores', 'me', 'publicacion')
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/corredores/me/publicacion');
    expect(init.headers['x-corredor-identidad']).toBe(IDENTIDAD);
    expect(init.headers['x-platenzen-secret']).toBe(ENV.PLATENZEN_SERVER_SECRET);
  });

  it('el ranking es público y conserva el orden pedido', async () => {
    fetchMock.mockResolvedValue(json(200, { data: { ligas: {} } }));
    const res = await GET(pedido('/api/club/ranking?orden=ritmo'), ctx('ranking'));
    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/ranking?orden=ritmo');
    expect(fetchMock.mock.calls[0][1].headers['x-corredor-identidad']).toBeUndefined();
  });

  it('un error de negocio de la API llega tal cual', async () => {
    fetchMock.mockResolvedValue(json(409, { error: 'NOMBRE_EN_USO' }));
    const res = await POST(
      pedido('/api/club/corredores/me', { method: 'POST', cookie: cookie(), body: '{}' }),
      ctx('corredores', 'me')
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'NOMBRE_EN_USO' });
  });

  it('un 401 de la API es configuración rota entre servidores: se informa como club no disponible', async () => {
    fetchMock.mockResolvedValue(json(401, { error: 'CLIENTE_NO_AUTORIZADO' }));
    const res = await GET(pedido('/api/club/ranking'), ctx('ranking'));
    expect(res.status).toBe(503);
  });
});
