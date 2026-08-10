import { decodePolyline } from '@/lib/polylineDecoder';

/** Codifica un valor con el zigzag de Google Polyline, para construir fixtures. */
function encodeValue(value: number): string {
  let v = Math.round(value * 1e5) << 1;
  if (v < 0) v = ~v;
  let out = '';
  while (v >= 0x20) {
    out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  return out + String.fromCharCode(v + 63);
}

/** Codifica una secuencia de puntos absolutos como deltas sucesivos. */
function encodePolyline(points: Array<[number, number]>): string {
  let prevLat = 0;
  let prevLon = 0;
  let out = '';
  for (const [lat, lon] of points) {
    out += encodeValue(lat - prevLat) + encodeValue(lon - prevLon);
    prevLat = lat;
    prevLon = lon;
  }
  return out;
}

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

  it('decodifica un delta de longitud positivo (rumbo este)', () => {
    const encoded = encodePolyline([[10, -70], [11, -65]]);
    const coords = decodePolyline(encoded);

    expect(coords[1][1]).toBeGreaterThan(coords[0][1]);
    expect(coords[1]).toEqual([11, -65]);
  });
});
