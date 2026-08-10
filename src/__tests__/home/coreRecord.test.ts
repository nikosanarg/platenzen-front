/**
 * El récord del hero: la distancia oficial más alta que el corredor realmente
 * alcanzó, y su mejor tiempo proyectado ahí. Es el número más visible del
 * producto, así que la proyección y el umbral de "alcanzada" van verificados.
 */
import { computeCoreRecord } from '@/lib/coreRecord';
import { activity } from '@/__tests__/helpers/activity';

describe('computeCoreRecord', () => {
  it('devuelve null sin actividades', () => {
    expect(computeCoreRecord([])).toBeNull();
  });

  it('devuelve null si nunca se llegó a los 5K', () => {
    expect(computeCoreRecord([activity({ distance: 4999, moving_time: 1500 })])).toBeNull();
  });

  it('elige la distancia más alta alcanzada, no la más frecuente', () => {
    const record = computeCoreRecord([
      activity({ id: 1, distance: 5000, moving_time: 1500 }),
      activity({ id: 2, distance: 5000, moving_time: 1480 }),
      activity({ id: 3, distance: 10000, moving_time: 3200 }),
    ]);

    expect(record?.label).toBe('10K');
  });

  it('proyecta el tiempo a la distancia exacta de forma lineal', () => {
    // 10 km en 3000 s, proyectado a 5 km = 1500 s.
    const record = computeCoreRecord([activity({ distance: 10000, moving_time: 3000 })]);

    expect(record?.label).toBe('10K');
    expect(record?.timeSeconds).toBe(3000);
  });

  it('se queda con la proyección más rápida entre las que alcanzan la distancia', () => {
    const record = computeCoreRecord([
      activity({ id: 1, distance: 10000, moving_time: 3600 }),
      activity({ id: 2, distance: 12000, moving_time: 3600 }), // proyecta 3000 s a 10K
    ]);

    expect(record?.label).toBe('10K');
    expect(record?.timeSeconds).toBe(3000);
  });

  it('no cuenta una salida de 21 km redondos como media maratón', () => {
    const record = computeCoreRecord([activity({ distance: 21000, moving_time: 7000 })]);

    expect(record?.label).toBe('10K');
  });

  it('cuenta la media maratón recién a los 21.0975 km', () => {
    const record = computeCoreRecord([activity({ distance: 21097.5, moving_time: 7000 })]);

    expect(record?.label).toBe('21K');
  });

  it('ignora las actividades que no son de running', () => {
    const record = computeCoreRecord([
      activity({ id: 1, sport_type: 'Ride', type: 'Ride', distance: 40000, moving_time: 3600 }),
      activity({ id: 2, distance: 5000, moving_time: 1500 }),
    ]);

    expect(record?.label).toBe('5K');
  });

  it('cuenta como running una actividad con sport_type vacío, usando el type como respaldo', () => {
    const record = computeCoreRecord([activity({ sport_type: '', type: 'Run', distance: 5000, moving_time: 1500 })]);

    expect(record?.label).toBe('5K');
  });

  it('cuenta trail y cinta como running', () => {
    expect(
      computeCoreRecord([
        activity({ sport_type: 'TrailRun', type: 'TrailRun', distance: 10000, moving_time: 3600 }),
      ])?.label,
    ).toBe('10K');

    expect(
      computeCoreRecord([
        activity({ sport_type: 'VirtualRun', type: 'VirtualRun', distance: 10000, moving_time: 3600 }),
      ])?.label,
    ).toBe('10K');
  });

  it('descarta actividades sin tiempo o sin distancia, que romperían la proyección', () => {
    expect(computeCoreRecord([activity({ distance: 10000, moving_time: 0 })])).toBeNull();
    expect(computeCoreRecord([activity({ distance: 0, moving_time: 3000 })])).toBeNull();
  });
});
