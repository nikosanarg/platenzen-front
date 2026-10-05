/**
 * El cliente del club en el navegador. Se fija el contrato con el proxy: una
 * sesión vencida se reabre una vez y no en bucle, "no registrado" es un estado
 * y no un error, y el código de error de la API llega a la pantalla.
 */
import {
  ErrorClub,
  miPerfil,
  obtenerFicha,
  obtenerRanking,
  publicar,
  registrarse,
} from '@/lib/club/cliente';
import { ACUERDOS_VERSION } from '@/lib/club/acuerdos';

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

const json = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;
const vacio = (status: number) => ({ ok: true, status, json: async () => ({}) }) as Response;

const token = jest.fn(async () => 'tok');

describe('sesión', () => {
  it('ante un 401 abre la sesión con el token de Strava y reintenta una vez', async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { error: 'SIN_SESION' }))
      .mockResolvedValueOnce(vacio(204))
      .mockResolvedValueOnce(json(200, { data: { id: 'x', alias: 'melon000001' } }));

    const perfil = await miPerfil(token);

    expect(perfil).toMatchObject({ alias: 'melon000001' });
    expect(fetchMock.mock.calls[1][0]).toBe('/api/club/sesion');
    expect(fetchMock.mock.calls[1][1].headers).toEqual({ Authorization: 'Bearer tok' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('si la sesión no se puede abrir, falla con el código del servidor y no reintenta en bucle', async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { error: 'SIN_SESION' }))
      .mockResolvedValueOnce(json(401, { error: 'TOKEN_INVALIDO' }));

    await expect(miPerfil(token)).rejects.toMatchObject({ code: 'TOKEN_INVALIDO', status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('perfil', () => {
  it('no estar registrado es null, no un error', async () => {
    fetchMock.mockResolvedValue(json(404, { error: 'NO_REGISTRADO' }));
    expect(await miPerfil(token)).toBeNull();
  });

  it('el club caído es un error con status 503', async () => {
    fetchMock.mockResolvedValue(json(503, { error: 'CLUB_NO_DISPONIBLE' }));
    await expect(miPerfil(token)).rejects.toBeInstanceOf(ErrorClub);
    await expect(miPerfil(token)).rejects.toMatchObject({ status: 503 });
  });

  it('el alta manda la versión vigente de los acuerdos', async () => {
    fetchMock.mockResolvedValue(json(201, { data: { id: 'x' } }));
    await registrarse({ nombreVisible: null, pais: 'UY', visibilidad: 'publica' }, token);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/club/corredores/me');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      nombreVisible: null,
      pais: 'UY',
      visibilidad: 'publica',
      aceptaAcuerdos: ACUERDOS_VERSION,
    });
  });

  it('un error de negocio llega con su código', async () => {
    fetchMock.mockResolvedValue(json(409, { error: 'NOMBRE_EN_USO', message: 'Ese nombre ya lo eligió otro corredor' }));
    await expect(registrarse({ nombreVisible: 'Ana', pais: null, visibilidad: 'publica' }, token)).rejects.toMatchObject({
      code: 'NOMBRE_EN_USO',
      status: 409,
    });
  });

  it('publicar es un PUT con la publicación entera', async () => {
    fetchMock.mockResolvedValue(vacio(204));
    await publicar({ ficha: {} as never, dias: [], semanasActivas: ['2026-07-13'] }, token);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/club/corredores/me/publicacion');
    expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
  });
});

describe('lecturas públicas', () => {
  it('el ranking no abre sesión aunque falle con 401', async () => {
    fetchMock.mockResolvedValue(json(401, {}));
    await expect(obtenerRanking('distancia')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/club/ranking?orden=distancia');
  });

  it('una ficha que no existe o no es pública es null', async () => {
    fetchMock.mockResolvedValue(json(404, { error: 'CORREDOR_NO_ENCONTRADO' }));
    expect(await obtenerFicha('7b7c3d0e-1111-4222-8333-444455556666')).toBeNull();
  });

  it('una respuesta que no es JSON se informa como error interno', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502, json: async () => { throw new Error('html'); } } as unknown as Response);
    await expect(obtenerFicha('x')).rejects.toMatchObject({ code: 'ERROR_INTERNO', status: 502 });
  });
});
