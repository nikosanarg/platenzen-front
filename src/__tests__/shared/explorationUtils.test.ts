import { countDistinctStartingPlaces, haversineKm } from '@/lib/explorationUtils';
import { activity } from '@/__tests__/helpers/activity';

/** Polyline de un solo punto en el lat/lon dado, para fijar el arranque. */
function polylineAt(lat: number, lon: number): string {
  const encode = (value: number) => {
    let v = Math.round(value * 1e5) << 1;
    if (v < 0) v = ~v;
    let out = '';
    while (v >= 0x20) {
      out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    return out + String.fromCharCode(v + 63);
  };
  return encode(lat) + encode(lon);
}

describe('haversineKm', () => {
  it('da 0 entre un punto y sí mismo', () => {
    expect(haversineKm(-34.92, -57.95, -34.92, -57.95)).toBe(0);
  });

  it('mide la distancia La Plata – Buenos Aires (~53 km)', () => {
    const km = haversineKm(-34.9214, -57.9544, -34.6037, -58.3816);
    expect(km).toBeGreaterThan(50);
    expect(km).toBeLessThan(56);
  });

  it('es simétrica', () => {
    const ida = haversineKm(-34.92, -57.95, -34.6, -58.38);
    const vuelta = haversineKm(-34.6, -58.38, -34.92, -57.95);
    expect(ida).toBeCloseTo(vuelta, 9);
  });

  it('un grado de latitud son ~111 km', () => {
    expect(haversineKm(0, 0, 1, 0)).toBeCloseTo(111.19, 1);
  });
});

describe('countDistinctStartingPlaces', () => {
  it('no cuenta nada si ninguna actividad tiene polyline', () => {
    expect(countDistinctStartingPlaces([activity(), activity({ id: 2 })])).toBe(0);
  });

  it('agrupa como un solo lugar los arranques a menos de 500 m', () => {
    const places = countDistinctStartingPlaces([
      activity({ id: 1, map: { summary_polyline: polylineAt(-34.9214, -57.9544) } }),
      // ~300 m al norte del anterior.
      activity({ id: 2, map: { summary_polyline: polylineAt(-34.9187, -57.9544) } }),
    ]);

    expect(places).toBe(1);
  });

  it('cuenta como distintos los arranques separados por más de 500 m', () => {
    const places = countDistinctStartingPlaces([
      activity({ id: 1, map: { summary_polyline: polylineAt(-34.9214, -57.9544) } }),
      activity({ id: 2, map: { summary_polyline: polylineAt(-34.6037, -58.3816) } }),
    ]);

    expect(places).toBe(2);
  });

  it('ignora las actividades sin polyline pero cuenta el resto', () => {
    const places = countDistinctStartingPlaces([
      activity({ id: 1 }),
      activity({ id: 2, map: { summary_polyline: polylineAt(-34.9214, -57.9544) } }),
    ]);

    expect(places).toBe(1);
  });

  it('tolera un polyline vacío', () => {
    expect(countDistinctStartingPlaces([activity({ map: { summary_polyline: '' } })])).toBe(0);
  });
});
