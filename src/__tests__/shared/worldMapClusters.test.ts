/**
 * Agrupado de celdas en "lugares donde corrés", que es lo que la lista del mapa
 * muestra como zonas.
 *
 * Internamente el mapa parte el mundo en celdas de ~1 km. Una corrida de 12 km
 * atraviesa diez, así que aparecía repetida en cada una: de ahí salían las seis
 * filas idénticas de "35.1 km · 3×" para las mismas tres salidas.
 *
 * El agrupado es geográfico y fijo a propósito. Si dependiera del zoom,
 * acercarse partiría un lugar en sus celdas y las filas repetidas volverían
 * justo a la escala en la que uno mira de cerca.
 */
import { clusterZones, MapZone, RADIO_ZONA_KM, ZoneActivity } from '@/lib/worldMap';

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

function celda(id: string, lat: number, lon: number, actividades: ZoneActivity[]): MapZone {
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

describe('una corrida que cruza varias celdas es una sola salida', () => {
  // El caso real que se veía en pantalla: tres salidas de 11.7 km por el mismo
  // recorrido de Rosario, atravesando once celdas contiguas.
  const tresSalidas = [actividad(1, 11.7), actividad(2, 11.7), actividad(3, 11.7)];
  const onceCeldas = Array.from({ length: 11 }, (_, i) =>
    celda(`celda-${i}`, -32.95 + i * 0.008, -60.65 + i * 0.008, tresSalidas)
  );

  it('reporta un solo lugar, no once', () => {
    expect(clusterZones(onceCeldas)).toHaveLength(1);
  });

  it('reporta tres salidas, no treinta y tres', () => {
    expect(clusterZones(onceCeldas)[0].visitCount).toBe(3);
  });

  it('reporta los kilómetros una sola vez', () => {
    expect(clusterZones(onceCeldas)[0].distanceKm).toBeCloseTo(35.1, 5);
  });

  it('no parte un recorrido largo aunque sus extremos queden lejísimos', () => {
    // Un recorrido es una LÍNEA, no una mancha: agrupar por distancia contra
    // una celda semilla lo partía en pedazos, porque el final de una salida de
    // 12 km está a 12 km del principio. Se mantienen juntas porque comparten
    // la salida, no porque estén cerca.
    const unaSalida = [actividad(1, 12)];
    const recorrido = Array.from({ length: 12 }, (_, i) =>
      celda(`km-${i}`, -32.95 + i * 0.05, -60.65, unaSalida)
    );

    const grupos = clusterZones(recorrido);

    expect(grupos).toHaveLength(1);
    expect(grupos[0].visitCount).toBe(1);
  });
});

describe('qué se considera el mismo lugar', () => {
  it('junta dos puntos del mismo barrio', () => {
    const cerca = [
      celda('a', -32.950, -60.650, [actividad(1)]),
      celda('b', -32.958, -60.657, [actividad(2)]), // ~1 km
    ];

    expect(clusterZones(cerca)).toHaveLength(1);
  });

  it('separa dos puntos de la misma ciudad pero de barrios distintos', () => {
    const lejos = [
      celda('centro', -32.950, -60.650, [actividad(1)]),
      celda('otro', -33.000, -60.700, [actividad(2)]), // ~7 km
    ];

    expect(clusterZones(lejos)).toHaveLength(2);
  });

  it('nunca junta dos ciudades', () => {
    const dosCiudades = [
      celda('rosario', -32.95, -60.65, [actividad(1)]),
      celda('bsas', -34.60, -58.40, [actividad(2)]),
    ];

    expect(clusterZones(dosCiudades)).toHaveLength(2);
  });

  it('no cambia el resultado según cuánto se haya acercado el mapa', () => {
    // Es la garantía de fondo: el agrupado no recibe el zoom, así que no hay
    // forma de que acercarse parta un lugar y repita filas.
    const celdas = Array.from({ length: 5 }, (_, i) =>
      celda(`c-${i}`, -32.95 + i * 0.005, -60.65, [actividad(1), actividad(2)])
    );

    expect(clusterZones(celdas)).toEqual(clusterZones(celdas));
    expect(clusterZones(celdas)).toHaveLength(1);
  });

  it('respeta un radio explícito cuando se lo pasan', () => {
    const aUnKm = [
      celda('a', -32.950, -60.650, [actividad(1)]),
      celda('b', -32.959, -60.650, [actividad(2)]),
    ];

    expect(clusterZones(aUnKm, RADIO_ZONA_KM)).toHaveLength(1);
    expect(clusterZones(aUnKm, 0.5)).toHaveLength(2);
  });
});

describe('datos del lugar', () => {
  it('toma la visita más reciente de todas sus celdas', () => {
    const grupos = clusterZones([
      celda('vieja', -32.950, -60.650, [actividad(1, 10, '2026-01-15')]),
      celda('nueva', -32.955, -60.655, [actividad(2, 10, '2026-08-09')]),
    ]);

    expect(grupos[0].lastVisit).toBe('2026-08-09');
  });

  it('se centra donde más se corrió, no en el promedio simple', () => {
    const muchas = Array.from({ length: 10 }, (_, i) => actividad(i + 1));
    const grupos = clusterZones([
      celda('frecuente', -32.950, -60.650, muchas),
      celda('ocasional', -32.962, -60.650, [actividad(99)]),
    ]);

    expect(grupos[0].lat).toBeGreaterThan(-32.953);
  });

  it('ordena de más a menos frecuentado', () => {
    const grupos = clusterZones([
      celda('poca', -20, -20, [actividad(1)]),
      celda('mucha', 20, 20, [actividad(2), actividad(3), actividad(4)]),
    ]);

    expect(grupos.map(g => g.visitCount)).toEqual([3, 1]);
  });

  it('devuelve lista vacía si no hay celdas', () => {
    expect(clusterZones([])).toEqual([]);
  });
});
