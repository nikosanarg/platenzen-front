/**
 * Nombre de un lugar por coordenada, vía Nominatim: de dónde sale el nombre
 * cuando hay varios candidatos, que un lugar ya resuelto no vuelve a pedirse,
 * y que un fallo no se reintenta en la misma sesión (uso aceptable del
 * servicio público: como mucho una request por lugar).
 *
 * El módulo se reimporta fresco en cada test (`jest.resetModules`): tiene
 * estado propio (la cola de requests, el timestamp del último pedido, los
 * fallos de la sesión) que si no, se arrastraría de un test a otro.
 */
type GetPlaceNameFn = typeof import('@/services/geocoding/nominatim').getPlaceName;

function mockFetchOnce(payload: unknown, ok = true, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(payload),
  });
}

async function cargarModulo(): Promise<GetPlaceNameFn> {
  const mod = await import('@/services/geocoding/nominatim');
  return mod.getPlaceName;
}

describe('getPlaceName', () => {
  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    global.fetch = jest.fn();
  });

  it('prioriza el nombre del lugar por sobre el barrio', async () => {
    const getPlaceName = await cargarModulo();
    mockFetchOnce({ name: 'Paseo del Bosque', address: { neighbourhood: 'Bosque' } });

    const nombre = await getPlaceName(-34.91, -57.95);

    expect(nombre).toBe('Paseo del Bosque');
  });

  it('sin nombre propio, cae al barrio, y de ahí al resto de la jerarquía', async () => {
    const getPlaceName = await cargarModulo();
    mockFetchOnce({ address: { suburb: 'Villa Elvira' } });

    expect(await getPlaceName(-34.92, -57.95)).toBe('Villa Elvira');
  });

  it('sin nada usable en la respuesta, devuelve null (el llamador decide el fallback)', async () => {
    const getPlaceName = await cargarModulo();
    mockFetchOnce({ address: {} });

    expect(await getPlaceName(-34.93, -57.95)).toBeNull();
  });

  it('una segunda consulta al mismo lugar no dispara una segunda request', async () => {
    const getPlaceName = await cargarModulo();
    mockFetchOnce({ name: 'Villa Elisa' });

    const primera = await getPlaceName(-34.87, -57.99);
    const segunda = await getPlaceName(-34.87, -57.99);

    expect(primera).toBe('Villa Elisa');
    expect(segunda).toBe('Villa Elisa');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('una respuesta con error de red devuelve null sin lanzar', async () => {
    const getPlaceName = await cargarModulo();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network down'));

    await expect(getPlaceName(-34.5, -58.1)).resolves.toBeNull();
  });

  it('un fallo no se reintenta en la misma sesión: la segunda consulta ni siquiera pide red', async () => {
    const getPlaceName = await cargarModulo();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network down'));

    await getPlaceName(-34.6, -58.2);
    const resultado = await getPlaceName(-34.6, -58.2);

    expect(resultado).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('un status HTTP no-ok se trata como fallo, no como nombre vacío', async () => {
    const getPlaceName = await cargarModulo();
    mockFetchOnce({}, false, 503);

    expect(await getPlaceName(-34.7, -58.3)).toBeNull();
  });
});
