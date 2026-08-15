/**
 * Encodes an array of [lat, lon] pairs into a Google-encoded polyline string.
 * Inverse of `decodePolyline` (`src/lib/polylineDecoder.ts`).
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 *
 * `decodePolyline(encodePolyline(c))` tiene que devolver `c` con la precisión
 * de 5 decimales del formato (el algoritmo redondea a 1e-5): no esperes
 * igualdad exacta en flotantes, sí en el valor redondeado a esa precisión.
 */
export function encodePolyline(coords: [number, number][]): string {
  if (coords.length === 0) return '';

  let out = '';
  let prevLat = 0;
  let prevLon = 0;

  for (const [lat, lon] of coords) {
    const latE5 = Math.round(lat * 1e5);
    const lonE5 = Math.round(lon * 1e5);
    out += encodeValue(latE5 - prevLat);
    out += encodeValue(lonE5 - prevLon);
    prevLat = latE5;
    prevLon = lonE5;
  }

  return out;
}

/** Codifica un único delta con el zigzag de Google Polyline. */
function encodeValue(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let out = '';
  while (v >= 0x20) {
    out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  out += String.fromCharCode(v + 63);
  return out;
}
