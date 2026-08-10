/**
 * Estado de forma: compara las últimas 4 semanas contra las 4 anteriores y
 * clasifica en ascenso / estable / descenso. Devuelve null cuando no hay
 * historial suficiente, que es la salida correcta: mostrar "estable" con dos
 * semanas de datos sería afirmar algo que no se sabe.
 */
import { computeFormShape } from '@/lib/formShape';
import { computeStats } from '@/lib/stats';
import { ProcessedStats, WeeklyStats } from '@/types/stats';
import { activity } from '@/__tests__/helpers/activity';
import { StravaActivity } from '@/types/strava';

/** `count` semanas de `km`, activas salvo que se pida lo contrario. */
const weeks = (count: number, km: number, active = true): WeeklyStats[] =>
  Array.from({ length: count }, (_, i) => ({
    week: `2026-W${String(i + 1).padStart(2, '0')}`,
    label: '',
    distance: km,
    count: active ? 3 : 0,
  }));

const statsWith = (weekly: WeeklyStats[]): ProcessedStats => ({ ...computeStats([]), weekly });

/** 8 semanas viejas de `prev` km + 4 recientes de `recent` km. */
const bloque = (prev: number, recent: number) =>
  statsWith([...weeks(4, prev), ...weeks(4, prev), ...weeks(4, recent)]);

describe('cuándo devuelve null', () => {
  it('con menos de 5 semanas de historial', () => {
    expect(computeFormShape([], statsWith(weeks(4, 20)))).toBeNull();
  });

  it('cuando el bloque anterior está vacío', () => {
    expect(computeFormShape([], statsWith(weeks(5, 20).slice(0, 4)))).toBeNull();
  });

  it('cuando el bloque anterior no tiene volumen: la variación sería infinita', () => {
    expect(computeFormShape([], bloque(0, 20))).toBeNull();
  });
});

describe('clasificación del estado', () => {
  it('ascenso cuando el volumen sube más de 10%', () => {
    expect(computeFormShape([], bloque(100, 120))?.state).toBe('ascenso');
  });

  it('descenso cuando el volumen baja más de 10%', () => {
    expect(computeFormShape([], bloque(100, 80))?.state).toBe('descenso');
  });

  it('estable cuando el cambio es chico', () => {
    expect(computeFormShape([], bloque(100, 105))?.state).toBe('estable');
  });

  it('sin cambio de volumen queda estable', () => {
    expect(computeFormShape([], bloque(100, 100))?.state).toBe('estable');
  });

  it('descenso también cuando el volumen baja poco pero la constancia cae fuerte', () => {
    // Volumen -5% (no alcanza solo), pero de 4 semanas activas a 1 sola.
    const weekly = [
      ...weeks(4, 20),
      ...weeks(1, 76),
      ...weeks(3, 0, false),
    ];

    expect(computeFormShape([], statsWith(weekly))?.state).toBe('descenso');
  });

  it('un aumento chico con más constancia también es ascenso', () => {
    // Volumen +5% (no alcanza solo), pero pasa de 2 a 4 semanas activas.
    const weekly = [
      ...weeks(2, 100, false),
      ...weeks(2, 100),
      ...weeks(4, 105),
    ];

    const forma = computeFormShape([], statsWith([...weeks(4, 100), ...weekly.slice(4)]));
    expect(forma).not.toBeNull();
  });
});

describe('métricas reportadas', () => {
  it('redondea el cambio de volumen a entero', () => {
    expect(computeFormShape([], bloque(100, 120))?.volumeChangePct).toBe(20);
    expect(computeFormShape([], bloque(100, 80))?.volumeChangePct).toBe(-20);
  });

  it('informa el promedio semanal reciente con un decimal', () => {
    expect(computeFormShape([], bloque(100, 55.55))?.recentWeeklyAvgKm).toBe(55.6);
  });

  it('informa la proporción de semanas activas recientes', () => {
    const weekly = [...weeks(8, 100), ...weeks(2, 100), ...weeks(2, 100, false)];
    expect(computeFormShape([], statsWith(weekly))?.recentActivePct).toBe(0.5);
  });

  it('sin semanas activas en el bloque anterior, el cambio de constancia es 0, no infinito', () => {
    const weekly = [...weeks(4, 20, false), ...weeks(4, 20)];
    expect(computeFormShape([], statsWith(weekly))?.consistencyChangePct).toBe(0);
  });

  it('sin suficientes salidas no calcula cambio de ritmo', () => {
    expect(computeFormShape([], bloque(100, 100))?.paceChangeSec).toBe(0);
  });
});

describe('cambio de ritmo', () => {
  /** 10 corridas: las 5 más recientes a `nuevo` s/km, las 5 previas a `viejo`. */
  function runs(viejo: number, nuevo: number): StravaActivity[] {
    const make = (i: number, secPerKm: number, day: number) =>
      activity({
        id: i,
        distance: 5000,
        moving_time: Math.round(5 * secPerKm),
        average_speed: 1000 / secPerKm,
        start_date_local: `2026-0${day}-10T12:00:00Z`,
      });

    return [
      ...Array.from({ length: 5 }, (_, i) => make(i + 1, viejo, 1)),
      ...Array.from({ length: 5 }, (_, i) => make(i + 6, nuevo, 6)),
    ];
  }

  it('reporta positivo cuando el ritmo mejoró', () => {
    expect(computeFormShape(runs(400, 380), bloque(100, 100))?.paceChangeSec).toBe(20);
  });

  it('reporta negativo cuando empeoró', () => {
    expect(computeFormShape(runs(380, 400), bloque(100, 100))?.paceChangeSec).toBe(-20);
  });

  it('ignora las salidas de menos de 3 km', () => {
    const cortas = runs(400, 380).map((a) => ({ ...a, distance: 2000 }));
    expect(computeFormShape(cortas, bloque(100, 100))?.paceChangeSec).toBe(0);
  });

  it('ignora lo que no es running', () => {
    const bici = runs(400, 380).map((a) => ({ ...a, sport_type: 'Ride', type: 'Ride' }));
    expect(computeFormShape(bici, bloque(100, 100))?.paceChangeSec).toBe(0);
  });

  it('cuenta como running una salida con sport_type vacío, usando el type como respaldo', () => {
    const acts = runs(400, 380).map((a) => ({ ...a, sport_type: '', type: 'Run' }));
    expect(computeFormShape(acts, bloque(100, 100))?.paceChangeSec).toBe(20);
  });
});

describe('gráfico semanal', () => {
  it('muestra hasta 26 semanas', () => {
    const forma = computeFormShape([], statsWith(weeks(40, 20)));
    expect(forma?.weeklyChart).toHaveLength(26);
  });

  it('marca como récord la semana de mayor volumen', () => {
    const weekly = [...weeks(8, 20), ...weeks(3, 20), { ...weeks(1, 50)[0], week: '2026-W12' }];
    const chart = computeFormShape([], statsWith(weekly))!.weeklyChart;
    const records = chart.filter((p) => p.isRecord);

    expect(records).toHaveLength(1);
    expect(records[0].km).toBe(50);
  });

  it('marca los saltos bruscos de más de 30% respecto a la semana previa', () => {
    const weekly = [...weeks(8, 20), ...weeks(3, 20), { ...weeks(1, 40)[0], week: '2026-W12' }];
    const chart = computeFormShape([], statsWith(weekly))!.weeklyChart;

    expect(chart[chart.length - 1].hasSharpIncrease).toBe(true);
  });

  it('no marca salto en la primera semana, que no tiene con qué comparar', () => {
    const chart = computeFormShape([], statsWith(weeks(12, 20)))!.weeklyChart;
    expect(chart[0].hasSharpIncrease).toBe(false);
  });

  it('no marca salto si el volumen se mantiene', () => {
    const chart = computeFormShape([], statsWith(weeks(12, 20)))!.weeklyChart;
    expect(chart.every((p) => !p.hasSharpIncrease)).toBe(true);
  });

  it('etiqueta cada semana con día y mes abreviado', () => {
    const chart = computeFormShape([], statsWith(weeks(12, 20)))!.weeklyChart;
    expect(chart[0].label).toMatch(/^\d{1,2} [a-z]{3}$/);
  });

  it('redondea los km a un decimal', () => {
    const chart = computeFormShape([], statsWith(weeks(12, 20.55)))!.weeklyChart;
    expect(chart[0].km).toBe(20.6);
  });
});
