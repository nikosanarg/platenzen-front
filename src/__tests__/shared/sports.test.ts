import { deporte, isRunning, isTrailRun, RUNNING_SPORTS } from '@/lib/sports';
import { toActivity } from '@/services/providers/strava/adapter';

/**
 * El vocabulario de deportes vive en un solo archivo desde que se sacó de las
 * 21 copias que había. Estos tests fijan las dos cosas que esas copias no
 * garantizaban: que todas usen el mismo criterio, y que el respaldo de
 * `sport_type` vacío exista siempre.
 */

describe('deporte', () => {
  it('prefiere sport_type, que es el específico', () => {
    expect(deporte({ type: 'Run', sport_type: 'TrailRun' })).toBe('TrailRun');
  });

  it('cae a type cuando sport_type viene vacío, como en las actividades viejas de Strava', () => {
    expect(deporte({ type: 'Run', sport_type: '' })).toBe('Run');
    expect(deporte({ type: 'Run' })).toBe('Run');
  });
});

describe('isRunning', () => {
  it.each(['Run', 'TrailRun', 'VirtualRun'])('cuenta %s como corrida', (sport) => {
    expect(isRunning({ type: sport, sport_type: sport })).toBe(true);
  });

  it.each(['Ride', 'Swim', 'Walk', 'Hike', 'Workout'])('no cuenta %s', (sport) => {
    expect(isRunning({ type: sport, sport_type: sport })).toBe(false);
  });

  it('reconoce una corrida vieja que sólo trae type', () => {
    expect(isRunning({ type: 'Run', sport_type: '' })).toBe(true);
  });
});

describe('isTrailRun', () => {
  it('distingue el trail del resto de las corridas', () => {
    expect(isTrailRun({ type: 'TrailRun', sport_type: 'TrailRun' })).toBe(true);
    expect(isTrailRun({ type: 'Run', sport_type: 'Run' })).toBe(false);
  });
});

describe('el vocabulario como contrato entre proveedores', () => {
  it('acepta una Activity ya adaptada, venga del proveedor que venga', () => {
    const deStrava = toActivity({
      id: 1,
      name: 'Trail',
      type: 'TrailRun',
      sport_type: 'TrailRun',
      distance: 10000,
      moving_time: 3600,
      elapsed_time: 3600,
      total_elevation_gain: 400,
      start_date: '2026-03-15T11:00:00Z',
      start_date_local: '2026-03-15T08:00:00Z',
      average_speed: 10000 / 3600,
      max_speed: 4,
      kudos_count: 0,
      athlete_count: 1,
    });

    expect(isRunning(deStrava)).toBe(true);
    expect(isTrailRun(deStrava)).toBe(true);
  });

  it('expone el conjunto sin permitir que un consumidor lo modifique por accidente', () => {
    expect([...RUNNING_SPORTS].sort()).toEqual(['Run', 'TrailRun', 'VirtualRun']);
  });
});
