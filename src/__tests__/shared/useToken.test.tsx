/**
 * Manejo del token de Strava. El refresh token es una credencial de larga
 * vida y ya no pasa por el cliente: vive en una cookie httpOnly que sólo
 * leen las rutas de servidor. Lo que se verifica acá es la mitad que sí es
 * del cliente: que el access token viva en localStorage (sobrevive el cierre
 * de la pestaña, a diferencia del refresh token de antes), que se refresque
 * antes de vencer contra /api/strava/refresh sin mandar nada en el body, que
 * los refrescos concurrentes no disparen dos llamadas, y que un valor
 * guardado en el formato viejo (con refreshToken) se descarte.
 *
 * Todos los valores de token son ficticios.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { StoredToken, useToken } from '@/hooks/useToken';

const TOKEN_KEY = 'platenzen_strava_token';
const AHORA_SEC = 1_800_000_000;

/** Token ficticio que vence `enSegundos` después de ahora. */
const fakeToken = (enSegundos: number, sufijo = 'a'): StoredToken => ({
  accessToken: `acceso-falso-${sufijo}`,
  expiresAt: AHORA_SEC + enSegundos,
  createdAt: AHORA_SEC * 1000,
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(AHORA_SEC * 1000);
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const mockFetch = () => global.fetch as jest.Mock;

describe('lectura inicial', () => {
  it('arranca sin token si el storage está vacío', () => {
    const { result } = renderHook(() => useToken());

    expect(result.current.hasToken).toBe(false);
    expect(result.current.token).toBeNull();
  });

  it('recupera un token válido ya guardado', () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(fakeToken(3600)));
    const { result } = renderHook(() => useToken());

    expect(result.current.hasToken).toBe(true);
    expect(result.current.token).toBe('acceso-falso-a');
  });

  it('descarta y limpia un token del formato viejo, con refreshToken', () => {
    localStorage.setItem(
      TOKEN_KEY,
      JSON.stringify({ accessToken: 'viejo', refreshToken: 'refresco-viejo', expiresAt: AHORA_SEC + 3600 }),
    );
    const { result } = renderHook(() => useToken());

    expect(result.current.hasToken).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('descarta un token sin fecha de vencimiento', () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ accessToken: 'x' }));
    const { result } = renderHook(() => useToken());

    expect(result.current.hasToken).toBe(false);
  });

  it('tolera contenido corrupto en el storage', () => {
    localStorage.setItem(TOKEN_KEY, '{no es json');
    const { result } = renderHook(() => useToken());

    expect(result.current.hasToken).toBe(false);
  });
});

describe('saveToken / clearToken', () => {
  it('guarda en localStorage y expone el token', () => {
    const { result } = renderHook(() => useToken());

    act(() => result.current.saveToken(fakeToken(3600)));

    expect(result.current.hasToken).toBe(true);
    expect(result.current.token).toBe('acceso-falso-a');
    expect(localStorage.getItem(TOKEN_KEY)).not.toBeNull();
  });

  it('usa localStorage y no sessionStorage: el access token sobrevive el cierre de la pestaña', () => {
    const { result } = renderHook(() => useToken());

    act(() => result.current.saveToken(fakeToken(3600)));

    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('clearToken borra el token del storage y del estado', async () => {
    const { result } = renderHook(() => useToken());

    act(() => result.current.saveToken(fakeToken(3600)));
    await act(async () => {
      await result.current.clearToken();
    });

    expect(result.current.hasToken).toBe(false);
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe('getValidToken', () => {
  it('devuelve null si no hay token guardado', async () => {
    const { result } = renderHook(() => useToken());

    await expect(result.current.getValidToken()).resolves.toBeNull();
    expect(mockFetch()).not.toHaveBeenCalled();
  });

  it('devuelve el token vigente sin llamar a la API', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(fakeToken(3600)));
    const { result } = renderHook(() => useToken());

    await expect(result.current.getValidToken()).resolves.toBe('acceso-falso-a');
    expect(mockFetch()).not.toHaveBeenCalled();
  });

  it('refresca antes de vencer: con 4 minutos restantes ya lo renueva', async () => {
    // El buffer de refresco es de 5 minutos.
    localStorage.setItem(TOKEN_KEY, JSON.stringify(fakeToken(240)));
    mockFetch().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'acceso-nuevo',
        expires_at: AHORA_SEC + 21600,
      }),
    });

    const { result } = renderHook(() => useToken());

    // El refresco exitoso actualiza el estado del hook, así que va dentro de act.
    await act(async () => {
      await expect(result.current.getValidToken()).resolves.toBe('acceso-nuevo');
    });
    expect(mockFetch()).toHaveBeenCalledTimes(1);
  });

  it('no refresca con 6 minutos restantes', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(fakeToken(360)));
    const { result } = renderHook(() => useToken());

    await expect(result.current.getValidToken()).resolves.toBe('acceso-falso-a');
    expect(mockFetch()).not.toHaveBeenCalled();
  });

  it('el refresco va por la ruta de servidor, sin mandar nada en el body', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(fakeToken(0)));
    mockFetch().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'acceso-nuevo',
        expires_at: AHORA_SEC + 21600,
      }),
    });

    const { result } = renderHook(() => useToken());
    await act(async () => {
      await result.current.getValidToken();
    });

    const [url, init] = mockFetch().mock.calls[0];
    expect(url).toBe('/api/strava/refresh');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
  });

  it('persiste el token renovado en localStorage', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(fakeToken(0)));
    mockFetch().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'acceso-nuevo',
        expires_at: AHORA_SEC + 21600,
      }),
    });

    const { result } = renderHook(() => useToken());
    await act(async () => {
      await result.current.getValidToken();
    });

    await waitFor(() => expect(result.current.token).toBe('acceso-nuevo'));
    const guardado = JSON.parse(localStorage.getItem(TOKEN_KEY)!);
    expect(guardado.accessToken).toBe('acceso-nuevo');
  });

  it('deduplica refrescos concurrentes en una sola llamada', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(fakeToken(0)));
    mockFetch().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'acceso-nuevo',
        expires_at: AHORA_SEC + 21600,
      }),
    });

    const { result } = renderHook(() => useToken());

    const resultados = await act(async () =>
      Promise.all([
        result.current.getValidToken(),
        result.current.getValidToken(),
        result.current.getValidToken(),
      ]),
    );

    // Respetar el límite de la API de Strava: tres pedidos, un solo refresco.
    expect(mockFetch()).toHaveBeenCalledTimes(1);
    expect(resultados).toEqual(['acceso-nuevo', 'acceso-nuevo', 'acceso-nuevo']);
  });

  it('devuelve null si la ruta de refresco responde con error', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(fakeToken(0)));
    mockFetch().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: 'reauthorize' }) });

    const { result } = renderHook(() => useToken());

    await expect(result.current.getValidToken()).resolves.toBeNull();
  });

  it('devuelve null si la red falla, sin propagar la excepción', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(fakeToken(0)));
    mockFetch().mockRejectedValue(new Error('sin red'));

    const { result } = renderHook(() => useToken());

    await expect(result.current.getValidToken()).resolves.toBeNull();
  });

  it('un refresco fallido no borra el token guardado', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(fakeToken(0)));
    mockFetch().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: 'reauthorize' }) });

    const { result } = renderHook(() => useToken());
    await result.current.getValidToken();

    expect(localStorage.getItem(TOKEN_KEY)).not.toBeNull();
  });

  it('permite reintentar después de un fallo', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(fakeToken(0)));
    mockFetch()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ error: 'transient' }) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'acceso-nuevo',
          expires_at: AHORA_SEC + 21600,
        }),
      });

    const { result } = renderHook(() => useToken());

    await expect(result.current.getValidToken()).resolves.toBeNull();
    await act(async () => {
      await expect(result.current.getValidToken()).resolves.toBe('acceso-nuevo');
    });
    expect(mockFetch()).toHaveBeenCalledTimes(2);
  });
});
