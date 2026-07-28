/**
 * Análisis del coach sobre la última salida. Compone cinco bloques (cabecera de
 * la actividad, observaciones, destacados, agenda de 3 días y veredicto) a
 * partir de la última corrida, el estado de forma y la recomendación del coach.
 *
 * Lo que se verifica es que ningún bloque afirme algo que los datos no sostienen
 * y que el tono se mantenga factual, sin arengas. Al pasar por
 * `computeEnrichedLastActivity`, este test también ejercita ese módulo.
 */
import { computeCoachAnalisis } from '@/lib/coachAnalisis';
import { computeEnrichedLastActivity } from '@/lib/lastActivity';
import { computeStats } from '@/lib/stats';
import { activity } from '@/__tests__/helpers/activity';
import { StravaActivity } from '@/types/strava';

const NOW = new Date('2026-07-15T12:00:00Z');

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

function runDaysAgo(days: number, over: Partial<StravaActivity> = {}, id = 1): StravaActivity {
  const iso = new Date(NOW.getTime() - days * 86400000).toISOString();
  return activity({
    id,
    distance: 10000,
    moving_time: 3000,
    start_date: iso,
    start_date_local: iso,
    ...over,
  });
}

/** Historial de `count` corridas, una cada dos días hacia atrás. */
const historial = (count: number, over: Partial<StravaActivity> = {}): StravaActivity[] =>
  Array.from({ length: count }, (_, i) => runDaysAgo(i * 2, over, i + 1));

const analisisOf = (acts: StravaActivity[]) => computeCoachAnalisis(acts, computeStats(acts));

describe('cuándo devuelve null', () => {
  it('sin actividades', () => {
    expect(analisisOf([])).toBeNull();
  });

  it('cuando no hay ninguna corrida', () => {
    const acts = [runDaysAgo(1, { sport_type: 'Ride', type: 'Ride' })];
    expect(analisisOf(acts)).toBeNull();
  });
});

describe('cabecera de la actividad', () => {
  it('describe la corrida más reciente, no la primera de la lista', () => {
    const acts = [
      runDaysAgo(10, { name: 'Vieja' }, 1),
      runDaysAgo(1, { name: 'Reciente' }, 2),
    ];

    expect(analisisOf(acts)!.activity.name).toBe('Reciente');
  });

  it('formatea distancia con dos decimales y duración como reloj', () => {
    const { activity: header } = analisisOf([runDaysAgo(1, { distance: 15010, moving_time: 4968 })])!;

    expect(header.distanceKm).toBe('15.01');
    expect(header.durationLabel).toBe('1:22:48');
  });

  it('omite las horas en salidas de menos de una hora', () => {
    const { activity: header } = analisisOf([runDaysAgo(1, { moving_time: 1500 })])!;
    expect(header.durationLabel).toBe('25:00');
  });

  it('fecha con mes abreviado, y la versión con hora incluye reloj', () => {
    const { activity: header } = analisisOf([runDaysAgo(1)])!;

    expect(header.dateLabel).toMatch(/^\d{1,2} [a-z]{3} \d{4}$/);
    expect(header.dateTimeLabel).toMatch(/^\d{1,2} [a-z]{3} \d{4}, \d{2}:\d{2}$/);
  });

  it('expone el ritmo por km', () => {
    expect(analisisOf([runDaysAgo(1, { distance: 10000, moving_time: 3000 })])!.activity.pace)
      .toBe('5:00/km');
  });

  it('enlaza a Strava por id', () => {
    expect(analisisOf([runDaysAgo(1, {}, 77)])!.activity.stravaUrl)
      .toBe('https://www.strava.com/activities/77');
  });

  it('el polyline es null cuando la actividad no lo trae', () => {
    expect(analisisOf([runDaysAgo(1)])!.activity.polyline).toBeNull();
  });

  it('pasa el polyline cuando existe', () => {
    const acts = [runDaysAgo(1, { map: { summary_polyline: '_p~iF~ps|U' } })];
    expect(analisisOf(acts)!.activity.polyline).toBe('_p~iF~ps|U');
  });
});

describe('observaciones', () => {
  it('devuelve una lista, posiblemente vacía, nunca undefined', () => {
    expect(Array.isArray(analisisOf([runDaysAgo(1)])!.insights)).toBe(true);
  });

  it('cada observación trae texto y tono válido', () => {
    for (const insight of analisisOf(historial(12))!.insights) {
      expect(insight.text.length).toBeGreaterThan(0);
      expect(['positive', 'neutral', 'warning']).toContain(insight.tone);
    }
  });

  it('mantiene el tono factual: sin signos de exclamación', () => {
    const analisis = analisisOf(historial(12))!;
    const todoElTexto = [
      ...analisis.insights.map((i) => i.text),
      ...analisis.highlights.map((h) => `${h.value} ${h.label} ${h.sub}`),
      ...analisis.bottomStats.map((s) => `${s.label} ${s.value} ${s.sub}`),
      analisis.verdict.title,
      analisis.verdict.detail,
    ].join(' ');

    expect(todoElTexto).not.toMatch(/[!¡]/);
  });
});

describe('destacados', () => {
  it('cada tarjeta trae ícono conocido, valor, etiqueta y tono', () => {
    for (const card of analisisOf(historial(12))!.highlights) {
      expect(['trend', 'medal', 'route', 'flame', 'calendar']).toContain(card.icon);
      expect(card.value.length).toBeGreaterThan(0);
      expect(card.label.length).toBeGreaterThan(0);
      expect(['positive', 'neutral', 'warning']).toContain(card.tone);
    }
  });
});

describe('agenda', () => {
  it('muestra hoy más los tres días siguientes', () => {
    const agenda = analisisOf(historial(12))!.agenda;

    expect(agenda).toHaveLength(4);
    expect(agenda[0].day).toBe('Hoy');
    expect(agenda[1].day).toBe('Mañana');
  });

  it('declara que hoy no hubo salida cuando la última fue otro día', () => {
    const agenda = analisisOf([runDaysAgo(3)])!.agenda;

    expect(agenda[0].kind).toBe('none');
    expect(agenda[0].label).toBe('Sin salida todavía');
  });

  it('cada día trae nombre, plan y tipo conocido', () => {
    for (const day of analisisOf(historial(12))!.agenda) {
      expect(day.day.length).toBeGreaterThan(0);
      expect(day.label.length).toBeGreaterThan(0);
      expect(['done', 'run', 'rest', 'none']).toContain(day.kind);
    }
  });

  it('marca como hecho el día en que ya salió', () => {
    const analisis = analisisOf([runDaysAgo(0.1)])!;
    expect(analisis.agenda.some((d) => d.kind === 'done')).toBe(true);
  });
});

describe('estadísticas del pie', () => {
  it('cada una trae ícono, etiqueta, valor y tono', () => {
    for (const stat of analisisOf(historial(12))!.bottomStats) {
      expect(['calendar', 'route', 'flame', 'trend', 'medal']).toContain(stat.icon);
      expect(stat.label.length).toBeGreaterThan(0);
      expect(stat.value.length).toBeGreaterThan(0);
      expect(['positive', 'neutral', 'warning']).toContain(stat.tone);
    }
  });

  it('concuerda el singular y el plural de la racha', () => {
    const analisis = analisisOf(historial(12))!;
    const racha = analisis.bottomStats.find((s) => s.label === 'Racha de actividad')!;

    expect(racha.value).toMatch(/^\d+ semanas?$/);
  });

  it('declara "primera semana con registro" cuando no hay con qué comparar', () => {
    const analisis = analisisOf([runDaysAgo(1)])!;
    const km = analisis.bottomStats.find((s) => s.label === 'Kilómetros esta semana')!;

    expect(km.sub).toBe('primera semana con registro');
  });
});

describe('veredicto', () => {
  /** Stats con 8 semanas de `prev` km y 4 recientes de `recent`, para fijar la tendencia. */
  const statsConTendencia = (prev: number, recent: number, currentStreak = 0) => {
    const semana = (i: number, distance: number) => ({
      week: `2026-W${String(i + 1).padStart(2, '0')}`,
      label: '',
      distance,
      count: 3,
    });

    return {
      ...computeStats([runDaysAgo(1)]),
      currentStreak,
      weekly: [
        ...Array.from({ length: 8 }, (_, i) => semana(i, prev)),
        ...Array.from({ length: 4 }, (_, i) => semana(i + 8, recent)),
      ],
    };
  };

  const verdictoCon = (prev: number, recent: number, streak = 0) =>
    computeCoachAnalisis([runDaysAgo(1)], statsConTendencia(prev, recent, streak))!.verdict;

  it('siempre trae título y detalle', () => {
    const { verdict } = analisisOf(historial(12))!;

    expect(verdict.title.length).toBeGreaterThan(0);
    expect(verdict.detail.length).toBeGreaterThan(0);
  });

  it('con volumen estable habla de consolidar', () => {
    const verdict = verdictoCon(100, 100);

    expect(verdict.title).toContain('estable');
    expect(verdict.detail).toContain('consolidar');
  });

  it('con volumen en alza reconoce la base sólida', () => {
    expect(verdictoCon(100, 130).title).toContain('camino correcto');
  });

  it('con volumen en baja lo dice sin dramatizar', () => {
    expect(verdictoCon(100, 70).title).toContain('Bajaste el volumen');
  });

  it('en baja con racha activa propone recuperar carga gradual', () => {
    expect(verdictoCon(100, 70, 3).detail).toContain('gradual');
  });

  it('en baja sin racha propone retomar con salidas cortas', () => {
    expect(verdictoCon(100, 70, 0).detail).toContain('cortas');
  });
});

describe('computeEnrichedLastActivity', () => {
  it('devuelve null sin corridas', () => {
    expect(computeEnrichedLastActivity([], computeStats([]))).toBeNull();
  });

  it('elige la corrida más reciente', () => {
    const acts = [runDaysAgo(10, {}, 1), runDaysAgo(1, {}, 2)];
    const enriched = computeEnrichedLastActivity(acts, computeStats(acts))!;

    expect(enriched.activity.id).toBe(2);
  });

  it('informa el XP ganado por esa salida y su desglose', () => {
    const acts = historial(6);
    const enriched = computeEnrichedLastActivity(acts, computeStats(acts))!;

    expect(enriched.xpEarned).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(enriched.xpDetails)).toBe(true);
  });

  it('informa el nivel actual y sólo el previo si cambió', () => {
    const acts = historial(6);
    const enriched = computeEnrichedLastActivity(acts, computeStats(acts))!;

    expect(enriched.currentLevel).toBeGreaterThanOrEqual(1);
    if (enriched.prevLevel !== null) {
      expect(enriched.prevLevel).not.toBe(enriched.currentLevel);
    }
  });

  it('muestra guión cuando la actividad no tiene velocidad', () => {
    const acts = [runDaysAgo(1, { average_speed: 0 })];
    expect(computeEnrichedLastActivity(acts, computeStats(acts))!.pace).toBe('—');
  });

  it('lista los logros nuevos y el impacto en el ADN', () => {
    const acts = [runDaysAgo(1, { distance: 21097.5, moving_time: 7000 })];
    const enriched = computeEnrichedLastActivity(acts, computeStats(acts))!;

    expect(Array.isArray(enriched.newAchievements)).toBe(true);
    expect(Array.isArray(enriched.dnaImpact)).toBe(true);
  });

  it('compara contra salidas de distancia similar cuando existen', () => {
    const acts = historial(8, { distance: 10000, moving_time: 3000 });
    const enriched = computeEnrichedLastActivity(acts, computeStats(acts))!;

    // Con historial parejo hay con qué comparar; sin él, la comparación es null.
    if (enriched.comparison !== null) {
      expect(typeof enriched.comparison).toBe('object');
    }
  });

  it('sin historial previo no hay comparación posible', () => {
    const acts = [runDaysAgo(1)];
    expect(computeEnrichedLastActivity(acts, computeStats(acts))!.comparison).toBeNull();
  });
});
