import { decodePolyline } from '@/lib/polylineDecoder';

describe('decodePolyline', () => {
  it('decodifica el ejemplo canónico de Google', () => {
    // Ejemplo de la especificación del algoritmo de polyline.
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([
      [38.5, -120.2],
      [40.7, -120.95],
      [43.252, -126.453],
    ]);
  });

  it('devuelve lista vacía con string vacío', () => {
    expect(decodePolyline('')).toEqual([]);
  });

  it('decodifica un único punto', () => {
    const [point] = decodePolyline('_p~iF~ps|U');
    expect(point).toEqual([38.5, -120.2]);
  });

  it('acumula los deltas: cada punto es relativo al anterior', () => {
    const coords = decodePolyline('_p~iF~ps|U_ulLnnqC');
    expect(coords[1][0]).toBeGreaterThan(coords[0][0]);
  });
});
