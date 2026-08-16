/**
 * Recomendación del coach. Es un árbol de decisión sobre dos números: la carga
 * ponderada de los últimos 14 días (cada día pesa 0.9^días, así que lo de hoy
 * pesa más que lo de la semana pasada) y el baseline de las 8 semanas previas.
 *
 * El orden de las ramas importa tanto como los umbrales: "corriste hoy" corta
 * antes que cualquier evaluación de carga. Si ese orden se altera, el coach
 * puede recomendar una salida larga el mismo día que el corredor ya salió.
 */
import { computeCoachRecommendation } from '@/lib/coach';
import { computeStats } from '@/lib/stats';
import { ProcessedStats, WeeklyStats } from '@/types/stats';
import { activity } from '@/__tests__/helpers/activity';
import { Activity } from '@/types/activity';

const NOW = new Date('2026-07-15T12:00:00Z');

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

/** Una corrida de `km` ubicada `days` días antes de ahora. */
function runDaysAgo(days: number, km: number, id = 1, over: Partial<Activity> = {}): Activity {
  const iso = new Date(NOW.getTime() - days * 86400000).toISOString();
  return activity({
    id,
    distance: km * 1000,
    moving_time: Math.round(km * 300),
    start_date: iso,
    start_date_local: iso,
    ...over,
  });
}

/** 9 semanas de `km` cada una: el baseline mira las 8 anteriores a la última. */
function weeksOf(km: number): WeeklyStats[] {
  return Array.from({ length: 9 }, (_, i) => ({
    week: `2026-W${String(i + 1).padStart(2, '0')}`,
    label: '',
    distance: km,
    count: 3,
  }));
}

const statsWith = (over: Partial<ProcessedStats> = {}): ProcessedStats => ({
  ...computeStats([]),
  weekly: weeksOf(10),
  ...over,
});

describe('casos sin datos suficientes', () => {
  it('sin corridas recomienda salida normal y lo declara', () => {
    const rec = computeCoachRecommendation([], statsWith());

    expect(rec.type).toBe('normal');
    expect(rec.loadState).toBe('sin datos');
    expect(rec.loadStateLabel).toBe('Sin datos suficientes');
    expect(rec.motivo[0]).toContain('No hay actividades registradas');
  });

  it('ignora lo que no es running', () => {
    const rec = computeCoachRecommendation(
      [activity({ sport_type: 'Ride', type: 'Ride', distance: 40000, moving_time: 3600 })],
      statsWith(),
    );

    expect(rec.loadState).toBe('sin datos');
  });

  it('cuenta como running una corrida con sport_type vacío, usando el type como respaldo', () => {
    const rec = computeCoachRecommendation(
      [runDaysAgo(1, 20, 1, { sport_type: '', type: 'Run' })],
      statsWith(),
    );

    expect(rec.loadState).not.toBe('sin datos');
  });

  it('ignora corridas sin distancia o sin tiempo', () => {
    const rec = computeCoachRecommendation(
      [activity({ distance: 0, moving_time: 1500 }), activity({ id: 2, distance: 5000, moving_time: 0 })],
      statsWith(),
    );

    expect(rec.loadState).toBe('sin datos');
  });

  it('sin baseline trata al corredor como principiante', () => {
    const rec = computeCoachRecommendation([runDaysAgo(1, 5)], statsWith({ weekly: weeksOf(0) }));

    expect(rec.type).toBe('normal');
    expect(rec.loadState).toBe('sin datos');
    expect(rec.motivo[0]).toContain('primeras semanas');
  });
});

describe('prioridad de "corriste hoy"', () => {
  it('recomienda descanso si ya salió hoy', () => {
    const rec = computeCoachRecommendation([runDaysAgo(0.1, 8)], statsWith());

    expect(rec.type).toBe('descanso');
    expect(rec.loadState).toBe('alta');
    expect(rec.motivo[0]).toBe('Corriste hoy.');
  });

  it('corta antes de evaluar la carga: incluso con carga baja recomienda descanso', () => {
    const rec = computeCoachRecommendation([runDaysAgo(0.1, 1)], statsWith({ weekly: weeksOf(50) }));

    expect(rec.type).toBe('descanso');
  });
});

describe('árbol de decisión por carga', () => {
  it('carga muy por encima del baseline (>1.5) → descanso', () => {
    // 20 km ayer sobre baseline 10 → carga ponderada 18, ratio 1.8.
    const rec = computeCoachRecommendation([runDaysAgo(1, 20)], statsWith());

    expect(rec.type).toBe('descanso');
    expect(rec.loadState).toBe('alta');
  });

  it('carga moderadamente alta (>1.2) → regenerativa', () => {
    // 15 km ayer → carga 13.5, ratio 1.35.
    const rec = computeCoachRecommendation([runDaysAgo(1, 15)], statsWith());

    expect(rec.type).toBe('regenerativa');
    expect(rec.loadState).toBe('moderada');
    expect(rec.loadStateLabel).toBe('Carga moderada-alta');
  });

  it('6 días o más sin correr → salida normal y carga baja', () => {
    const rec = computeCoachRecommendation([runDaysAgo(7, 8)], statsWith());

    expect(rec.type).toBe('normal');
    expect(rec.loadState).toBe('baja');
    expect(rec.motivo.some((m) => m.includes('días sin correr'))).toBe(true);
  });

  it('carga baja con descanso y buen volumen habitual → salida larga', () => {
    const rec = computeCoachRecommendation(
      [runDaysAgo(3, 5)],
      statsWith({ weeklyAvgDistance: 30 }),
    );

    expect(rec.type).toBe('larga');
    expect(rec.loadState).toBe('baja');
  });

  it('la misma carga baja con poco volumen habitual → salida normal', () => {
    const rec = computeCoachRecommendation(
      [runDaysAgo(3, 5)],
      statsWith({ weeklyAvgDistance: 10 }),
    );

    expect(rec.type).toBe('normal');
    expect(rec.loadState).toBe('baja');
  });

  it('carga equilibrada, descansado y alto volumen → entrenamiento de ritmo', () => {
    // 12 km hace 2 días → carga 9.72, ratio 0.97.
    const rec = computeCoachRecommendation(
      [runDaysAgo(2, 12)],
      statsWith({ weeklyAvgDistance: 35 }),
    );

    expect(rec.type).toBe('tempo');
    expect(rec.loadState).toBe('normal');
  });

  it('sin volumen alto, la carga equilibrada cae en salida normal', () => {
    const rec = computeCoachRecommendation(
      [runDaysAgo(2, 12)],
      statsWith({ weeklyAvgDistance: 15 }),
    );

    expect(rec.type).toBe('normal');
    expect(rec.loadState).toBe('normal');
  });

  it('carga dentro del rango habitual → normal, con motivo genérico', () => {
    // 7 km ayer → carga 6.3, ratio 0.63: ni baja ni equilibrada.
    const rec = computeCoachRecommendation([runDaysAgo(1, 7)], statsWith());

    expect(rec.type).toBe('normal');
    expect(rec.loadState).toBe('normal');
    expect(rec.motivo.length).toBeGreaterThan(0);
  });

  it('carga equilibrada sin cambio porcentual relevante usa el motivo por defecto de la rama de ritmo', () => {
    // 8 km hace 3 días sobre baseline 6 → carga 5.83, ratio 0.97: el cambio
    // porcentual (-3%) no llega al 5% que dispara su propio motivo, así que
    // esta rama depende de su mensaje por defecto.
    const rec = computeCoachRecommendation(
      [runDaysAgo(3, 8)],
      statsWith({ weekly: weeksOf(6), weeklyAvgDistance: 35 }),
    );

    expect(rec.type).toBe('tempo');
    expect(rec.motivo).toContain('Carga equilibrada y cuerpo descansado.');
  });

  it('carga equilibrada sin volumen alto ni cambio relevante usa el motivo por defecto genérico', () => {
    // 8 km ayer (carga ponderada 7.2) sobre baseline 7.2 → ratio 1.0 exacto:
    // sin cambio porcentual ni salida larga que generen motivo propio, y a
    // menos de 2 días no entra en la rama de ritmo. Sólo el motivo genérico
    // final la cubre.
    const rec = computeCoachRecommendation(
      [runDaysAgo(1, 8)],
      statsWith({ weekly: weeksOf(7.2) }),
    );

    expect(rec.type).toBe('normal');
    expect(rec.loadState).toBe('normal');
    expect(rec.motivo).toContain('Carga de entrenamiento dentro del rango habitual.');
  });
});

describe('carga ponderada', () => {
  it('descuenta 0.9 por día: lo viejo pesa menos', () => {
    const hoy = computeCoachRecommendation([runDaysAgo(0.6, 10)], statsWith());
    const haceCinco = computeCoachRecommendation([runDaysAgo(5, 10)], statsWith());

    expect(hoy.variables.weightedLoad).toBeGreaterThan(haceCinco.variables.weightedLoad);
  });

  it('ignora lo que pasó hace más de 14 días', () => {
    const rec = computeCoachRecommendation([runDaysAgo(20, 30)], statsWith());

    expect(rec.variables.weightedLoad).toBe(0);
  });

  it('acumula varias corridas dentro de la ventana', () => {
    const una = computeCoachRecommendation([runDaysAgo(3, 5)], statsWith());
    const dos = computeCoachRecommendation(
      [runDaysAgo(3, 5, 1), runDaysAgo(4, 5, 2)],
      statsWith(),
    );

    expect(dos.variables.weightedLoad).toBeGreaterThan(una.variables.weightedLoad);
  });
});

describe('variables reportadas', () => {
  it('redondea a un decimal y calcula el ratio', () => {
    const rec = computeCoachRecommendation([runDaysAgo(1, 20)], statsWith());

    expect(rec.variables.baselineKm).toBe(10);
    expect(rec.variables.weightedLoad).toBe(18);
    expect(rec.variables.loadRatio).toBe(1.8);
  });

  it('el ratio es null si no hay baseline, en lugar de infinito', () => {
    const rec = computeCoachRecommendation([runDaysAgo(1, 5)], statsWith({ weekly: [] }));
    expect(rec.variables.loadRatio).toBeNull();
  });

  it('informa días desde la última corrida, redondeados', () => {
    const rec = computeCoachRecommendation([runDaysAgo(3, 5)], statsWith());
    expect(rec.variables.daysSinceLastRun).toBe(3);
  });

  it('usa 999 días cuando no hay ninguna corrida en la ventana', () => {
    const rec = computeCoachRecommendation([runDaysAgo(20, 5)], statsWith());
    expect(rec.variables.daysSinceLastRun).toBe(999);
  });
});

describe('motivo', () => {
  it('menciona el cambio porcentual de carga cuando supera el 5%', () => {
    const rec = computeCoachRecommendation([runDaysAgo(1, 20)], statsWith());
    expect(rec.motivo.some((m) => m.includes('% carga ponderada'))).toBe(true);
  });

  it('pone signo + cuando la carga subió', () => {
    const rec = computeCoachRecommendation([runDaysAgo(1, 20)], statsWith());
    expect(rec.motivo.some((m) => m.startsWith('+'))).toBe(true);
  });

  it('menciona la salida larga reciente a partir de 12 km', () => {
    const rec = computeCoachRecommendation([runDaysAgo(1, 15)], statsWith());
    expect(rec.motivo.some((m) => m.includes('15.0 km completados'))).toBe(true);
  });

  it('no menciona salidas de menos de 12 km', () => {
    const rec = computeCoachRecommendation([runDaysAgo(1, 7)], statsWith());
    expect(rec.motivo.some((m) => m.includes('km completados'))).toBe(false);
  });

  it('describe el momento de la salida larga en lenguaje relativo', () => {
    expect(
      computeCoachRecommendation([runDaysAgo(1, 15)], statsWith()).motivo.join(' '),
    ).toContain('ayer');

    expect(
      computeCoachRecommendation([runDaysAgo(3, 15)], statsWith({ weekly: weeksOf(40) })).motivo.join(' '),
    ).toContain('hace 3 días');

    expect(
      computeCoachRecommendation([runDaysAgo(0.25, 15)], statsWith()).motivo.join(' '),
    ).toContain('horas');

    expect(
      computeCoachRecommendation([runDaysAgo(0.05, 15)], statsWith()).motivo.join(' '),
    ).toContain('hace menos de 2 horas');
  });

  it('siempre devuelve al menos un motivo', () => {
    const escenarios: Array<[number, number, Partial<ProcessedStats>]> = [
      [1, 20, {}],
      [1, 15, {}],
      [7, 8, {}],
      [3, 5, { weeklyAvgDistance: 30 }],
      [2, 12, { weeklyAvgDistance: 35 }],
      [1, 7, {}],
    ];

    for (const [days, km, over] of escenarios) {
      const rec = computeCoachRecommendation([runDaysAgo(days, km)], statsWith(over));
      expect(rec.motivo.length).toBeGreaterThan(0);
    }
  });
});

describe('etiquetas', () => {
  it('cada tipo trae su texto de recomendación', () => {
    const rec = computeCoachRecommendation([runDaysAgo(1, 20)], statsWith());

    expect(rec.label).toBe('Descanso activo o salida regenerativa de 4–6 km');
    expect(rec.label.length).toBeGreaterThan(0);
  });

  it('mantiene el tono factual: sin signos de exclamación', () => {
    const rec = computeCoachRecommendation([runDaysAgo(1, 20)], statsWith());
    expect([rec.label, ...rec.motivo].join(' ')).not.toMatch(/[!¡]/);
  });
});
