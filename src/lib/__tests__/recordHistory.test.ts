/**
 * Historial de récords por distancia. La lista sólo guarda las mejoras: cada
 * entrada tiene que ser más rápida que la anterior, y `improvementSeconds` es
 * cuánto le recortó a la marca previa (null en la primera, que no mejora nada).
 */
import {
  computeRecordHistories,
  formatImprovement,
  formatPace,
  formatRecordTime,
  fullDate,
  shortDate,
} from '@/lib/recordHistory';
import { HALF_MARATHON_KM } from '@/lib/distances';
import { activity } from '@/__tests__/helpers/activity';
import { StravaActivity } from '@/types/strava';

const on = (date: string, over: Partial<StravaActivity> = {}) =>
  activity({ start_date_local: `${date}T12:00:00Z`, start_date: `${date}T12:00:00Z`, ...over });

const forLabel = (acts: StravaActivity[], label: string) =>
  computeRecordHistories(acts).find((d) => d.label === label)!;

describe('computeRecordHistories: estructura', () => {
  it('devuelve las cuatro distancias', () => {
    expect(computeRecordHistories([]).map((d) => d.label)).toEqual(['5K', '10K', '15K', '21K']);
  });

  it('sin actividades deja el historial vacío y sin mejor marca', () => {
    for (const d of computeRecordHistories([])) {
      expect(d.history).toEqual([]);
      expect(d.currentBest).toBeNull();
    }
  });

  it('usa la distancia exacta de la media maratón', () => {
    const d = forLabel([], '21K');
    expect(d.distanceKm).toBe(HALF_MARATHON_KM);
    expect(d.targetM).toBe(21097.5);
  });
});

describe('buildHistory: sólo mejoras', () => {
  it('la primera marca válida entra sin mejora asociada', () => {
    const d = forLabel([on('2026-01-01', { distance: 5000, moving_time: 1500 })], '5K');

    expect(d.history).toHaveLength(1);
    expect(d.history[0].projectedTimeSeconds).toBe(1500);
    expect(d.history[0].improvementSeconds).toBeNull();
  });

  it('no registra una salida más lenta que la mejor marca', () => {
    const d = forLabel(
      [
        on('2026-01-01', { id: 1, distance: 5000, moving_time: 1500 }),
        on('2026-02-01', { id: 2, distance: 5000, moving_time: 1600 }),
      ],
      '5K',
    );

    expect(d.history).toHaveLength(1);
  });

  it('registra la mejora y cuánto recortó', () => {
    const d = forLabel(
      [
        on('2026-01-01', { id: 1, distance: 5000, moving_time: 1500 }),
        on('2026-02-01', { id: 2, distance: 5000, moving_time: 1440 }),
      ],
      '5K',
    );

    expect(d.history).toHaveLength(2);
    expect(d.history[1].improvementSeconds).toBe(60);
  });

  it('el historial queda en orden cronológico aunque la entrada no lo esté', () => {
    const d = forLabel(
      [
        on('2026-02-01', { id: 2, distance: 5000, moving_time: 1440 }),
        on('2026-01-01', { id: 1, distance: 5000, moving_time: 1500 }),
      ],
      '5K',
    );

    expect(d.history.map((h) => h.date)).toEqual(['2026-01-01', '2026-02-01']);
  });

  it('la mejor marca actual es la última del historial', () => {
    const d = forLabel(
      [
        on('2026-01-01', { id: 1, distance: 5000, moving_time: 1500 }),
        on('2026-02-01', { id: 2, distance: 5000, moving_time: 1440 }),
      ],
      '5K',
    );

    expect(d.currentBest?.projectedTimeSeconds).toBe(1440);
  });

  it('guarda id y nombre de la actividad que hizo el récord', () => {
    const d = forLabel([on('2026-01-01', { id: 42, name: 'Fondo del domingo', distance: 5000, moving_time: 1500 })], '5K');

    expect(d.history[0].activityId).toBe(42);
    expect(d.history[0].activityName).toBe('Fondo del domingo');
  });
});

describe('buildHistory: elegibilidad', () => {
  it('acepta salidas algo más cortas que el objetivo (4 km para el 5K)', () => {
    expect(forLabel([on('2026-01-01', { distance: 4000, moving_time: 1200 })], '5K').history).toHaveLength(1);
  });

  it('rechaza las que no llegan al mínimo', () => {
    expect(forLabel([on('2026-01-01', { distance: 3900, moving_time: 1200 })], '5K').history).toHaveLength(0);
  });

  it('ignora lo que no es running', () => {
    const acts = [on('2026-01-01', { sport_type: 'Ride', type: 'Ride', distance: 10000, moving_time: 1500 })];
    expect(forLabel(acts, '5K').history).toHaveLength(0);
  });

  it('ignora las salidas sin tiempo o sin velocidad', () => {
    expect(forLabel([on('2026-01-01', { distance: 5000, moving_time: 0 })], '5K').history).toHaveLength(0);
    expect(forLabel([on('2026-01-01', { distance: 5000, moving_time: 1500, average_speed: 0 })], '5K').history)
      .toHaveLength(0);
  });
});

describe('formatRecordTime', () => {
  it('omite las horas por debajo de la hora', () => {
    expect(formatRecordTime(1500)).toBe('25:00');
  });

  it('incluye horas cuando corresponde', () => {
    expect(formatRecordTime(7261)).toBe('2:01:01');
  });
});

describe('formatImprovement', () => {
  it('muestra segundos por debajo del minuto', () => {
    expect(formatImprovement(45)).toBe('45"');
  });

  it('muestra minutos y segundos', () => {
    expect(formatImprovement(125)).toBe("2' 5\"");
  });

  it('omite los segundos si son exactos', () => {
    expect(formatImprovement(120)).toBe("2'");
  });

  it('usa el valor absoluto', () => {
    expect(formatImprovement(-45)).toBe('45"');
  });
});

describe('shortDate / fullDate', () => {
  it('shortDate omite el año y no rellena el día', () => {
    expect(shortDate('2026-07-05')).toBe('5 jul');
  });

  it('fullDate escribe el mes completo', () => {
    expect(fullDate('2026-07-05')).toBe('5 de Julio de 2026');
  });
});

describe('formatPace', () => {
  it('formatea el ritmo por km', () => {
    expect(formatPace(300)).toBe('5:00/km');
  });

  it('muestra guión si no hay ritmo válido', () => {
    expect(formatPace(0)).toBe('—');
    expect(formatPace(-1)).toBe('—');
  });

  it('no imprime 60 segundos cuando el ritmo redondea hacia arriba', () => {
    // Regresión: antes devolvía "4:60/km".
    expect(formatPace(299.6)).toBe('5:00/km');
  });
});
