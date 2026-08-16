/**
 * Agrupado de zonas del mapa de Tu Mundo.
 *
 * Arregla dos cosas que se veían igual de mal y tenían causas distintas: las
 * zonas de una misma ciudad cayendo en los mismos píxeles cuando el mapa
 * abarca medio país, y una misma corrida contada una vez por cada celda de
 * ~1 km que atraviesa. Lo segundo es lo que producía seis filas idénticas de
 * "35.1 km · 3×" en la lista.
 */
import { clusterZones, MapZone, ZoneActivity } from '@/lib/worldMap';

function actividad(id: number, km = 10, fecha = '2026-07-02'): ZoneActivity {
  return {
    activityId: id,
    name: `Salida ${id}`,
    date: fecha,
    dateIso: `${fecha}T10:00:00Z`,
    distanceKm: km,
    paceSecPerKm: 300,
  };
}

function zona(id: string, lat: number, lon: number, actividades: ZoneActivity[]): MapZone {
  return {
    id,
    lat,
    lon,
    visitCount: actividades.length,
    distanceKm: actividades.reduce((s, a) => s + a.distanceKm, 0),
    lastVisit: actividades[0]?.date ?? '',
    bestPaceSecPerKm: 300,
    activities: actividades,
    gridLat: 0,
    gridLon: 0,
  };
}

/** Proyección de juguete: 1 grado = `escala` píxeles. Sube la escala para simular acercarse. */
const proyeccion = (escala: number) => (lat: number, lon: number): [number, number] =>
  [lon * escala, -lat * escala];

describe('agrupado por cercanía en pantalla', () => {
  const cerca = [
    zona('a', -34.90, -57.95, [actividad(1)]),
    zona('b', -34.91, -57.96, [actividad(2)]),
    zona('c', -34.92, -57.97, [actividad(3)]),
  ];

  it('junta en un punto las zonas que caen encima cuando el mapa está lejos', () => {
    // A 100 px por grado, las tres zonas están a ~1 px entre sí.
    const grupos = clusterZones(cerca, proyeccion(100), 44);

    expect(grupos).toHaveLength(1);
    expect(grupos[0].zoneCount).toBe(3);
  });

  it('las separa al acercarse, que es para lo que sirve el zoom', () => {
    // A 10000 px por grado, las mismas zonas quedan a ~100 px.
    const grupos = clusterZones(cerca, proyeccion(10000), 44);

    expect(grupos).toHaveLength(3);
    expect(grupos.every(g => g.zoneCount === 1)).toBe(true);
  });

  it('no junta zonas que están genuinamente lejos', () => {
    const lejos = [
      zona('bsas', -34.6, -58.4, [actividad(1)]),
      zona('neuquen', -38.9, -68.1, [actividad(2)]),
    ];

    expect(clusterZones(lejos, proyeccion(100), 44)).toHaveLength(2);
  });
});

describe('una corrida que cruza varias celdas se cuenta una sola vez', () => {
  // El caso real: tres salidas de 11.7 km atravesando seis celdas contiguas.
  // Antes producía seis zonas de "35.1 km · 3×" — el mismo dato repetido.
  const tresSalidas = [actividad(1, 11.7), actividad(2, 11.7), actividad(3, 11.7)];
  const seisCeldas = Array.from({ length: 6 }, (_, i) =>
    zona(`celda-${i}`, -34.9 - i * 0.01, -57.95 - i * 0.01, tresSalidas)
  );

  it('reporta tres salidas, no dieciocho', () => {
    const grupos = clusterZones(seisCeldas, proyeccion(100), 44);

    expect(grupos).toHaveLength(1);
    expect(grupos[0].visitCount).toBe(3);
  });

  it('reporta los kilómetros una sola vez', () => {
    const grupos = clusterZones(seisCeldas, proyeccion(100), 44);

    expect(grupos[0].distanceKm).toBeCloseTo(35.1, 5);
  });

  it('deja ver cuántas celdas quedaron adentro, para no fingir que era una sola', () => {
    expect(clusterZones(seisCeldas, proyeccion(100), 44)[0].zoneCount).toBe(6);
  });
});

describe('datos del grupo', () => {
  it('toma la visita más reciente de todas sus zonas', () => {
    const grupos = clusterZones(
      [
        zona('vieja', -34.90, -57.95, [actividad(1, 10, '2026-01-15')]),
        zona('nueva', -34.91, -57.96, [actividad(2, 10, '2026-08-09')]),
      ],
      proyeccion(100),
      44
    );

    expect(grupos[0].lastVisit).toBe('2026-08-09');
  });

  it('se centra donde más se corrió, no en el promedio simple', () => {
    const muchas = Array.from({ length: 10 }, (_, i) => actividad(i + 1));
    const grupos = clusterZones(
      [
        zona('frecuente', -34.90, -58.00, muchas),
        zona('ocasional', -34.99, -58.09, [actividad(99)]),
      ],
      proyeccion(100),
      44
    );

    // El centro tiene que estar mucho más cerca de la zona frecuente.
    expect(grupos[0].lat).toBeGreaterThan(-34.92);
  });

  it('ordena de más a menos frecuentado', () => {
    const grupos = clusterZones(
      [
        zona('poca', -20, -20, [actividad(1)]),
        zona('mucha', 20, 20, [actividad(2), actividad(3), actividad(4)]),
      ],
      proyeccion(100),
      44
    );

    expect(grupos.map(g => g.visitCount)).toEqual([3, 1]);
  });

  it('devuelve lista vacía si no hay zonas', () => {
    expect(clusterZones([], proyeccion(100), 44)).toEqual([]);
  });
});
