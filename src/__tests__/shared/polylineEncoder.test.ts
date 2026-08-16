import { encodePolyline } from '@/lib/polylineEncoder';
import { decodePolyline } from '@/lib/polylineDecoder';

/**
 * El encoder existe para que el GPS de Garmin —que llega como coordenadas
 * sueltas— entre al dominio en el mismo formato que el de Strava, y los cinco
 * consumidores de `map.summary_polyline` no se enteren de que hay dos
 * proveedores.
 *
 * Su única especificación es el decoder que ya estaba: lo que importa no es
 * cómo codifica, sino que `decodePolyline` recupere lo que se le dio.
 */

/** El mismo caso que fija `polylineDecoder.test.ts`, leído al revés. */
const CADENA_CANONICA = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const COORDS_CANONICAS: [number, number][] = [
  [38.5, -120.2],
  [40.7, -120.95],
  [43.252, -126.453],
];

describe('encodePolyline', () => {
  it('reproduce exactamente la cadena que el decoder ya sabe leer', () => {
    expect(encodePolyline(COORDS_CANONICAS)).toBe(CADENA_CANONICA);
  });

  it('sobrevive al ida y vuelta contra el decoder', () => {
    expect(decodePolyline(encodePolyline(COORDS_CANONICAS))).toEqual(COORDS_CANONICAS);
  });

  it('codifica una traza del hemisferio sur, con las dos coordenadas negativas', () => {
    // El caso donde un complemento a dos mal implementado falla en silencio.
    const laPlata: [number, number][] = [
      [-34.9214, -57.9544],
      [-34.9187, -57.9531],
      [-34.9155, -57.9502],
    ];

    expect(decodePolyline(encodePolyline(laPlata))).toEqual(laPlata);
  });

  it('cruza el origen sin perder el signo', () => {
    const cruce: [number, number][] = [
      [-0.0001, 0.0001],
      [0, 0],
      [0.0001, -0.0001],
    ];

    expect(decodePolyline(encodePolyline(cruce))).toEqual(cruce);
  });

  it('redondea a los 5 decimales del formato en vez de fallar', () => {
    expect(decodePolyline(encodePolyline([[-34.92141234, -57.95446789]]))).toEqual([
      [-34.92141, -57.95447],
    ]);
  });

  it('devuelve cadena vacía para una traza sin puntos, que el decoder lee como lista vacía', () => {
    expect(encodePolyline([])).toBe('');
    expect(decodePolyline(encodePolyline([]))).toEqual([]);
  });

  it('codifica un solo punto', () => {
    expect(decodePolyline(encodePolyline([[38.5, -120.2]]))).toEqual([[38.5, -120.2]]);
  });
});
