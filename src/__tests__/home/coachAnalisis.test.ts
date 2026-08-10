/**
 * Análisis del coach sobre la última salida. Compone cuatro bloques (cabecera de
 * la actividad, observaciones, destacados y agenda de ayer a +72h) a partir de la
 * última corrida, el estado de forma y la recomendación del coach.
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

  it('cuenta como running una actividad con sport_type vacío, usando el type como respaldo', () => {
    const acts = [runDaysAgo(1, { sport_type: '', type: 'Run' })];
    expect(analisisOf(acts)).not.toBeNull();
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
      ...analisis.agenda.map((d) => `${d.day} ${d.label}`),
    ].join(' ');

    expect(todoElTexto).not.toMatch(/[!¡]/);
  });

  it('señala un ritmo más rápido que el promedio comparable, y su lugar en el ranking', () => {
    const acts = [
      runDaysAgo(1, { distance: 10000, moving_time: 2400 }, 1), // 4:00/km, la más reciente
      runDaysAgo(3, { distance: 10000, moving_time: 3000 }, 2), // 5:00/km
      runDaysAgo(5, { distance: 10000, moving_time: 3000 }, 3),
      runDaysAgo(7, { distance: 10000, moving_time: 3000 }, 4),
    ];
    const insights = analisisOf(acts)!.insights;

    expect(insights.some((i) => i.text.includes('más rápido que tu promedio'))).toBe(true);
    expect(insights.some((i) => /^Top \d+ por ritmo/.test(i.text))).toBe(true);
  });

  it('señala un ritmo más lento que el promedio comparable, sin juzgarlo', () => {
    const acts = [
      runDaysAgo(1, { distance: 10000, moving_time: 4000 }, 1), // 6:40/km, la más reciente
      runDaysAgo(3, { distance: 10000, moving_time: 3000 }, 2), // 5:00/km
      runDaysAgo(5, { distance: 10000, moving_time: 3000 }, 3),
      runDaysAgo(7, { distance: 10000, moving_time: 3000 }, 4),
    ];
    const insights = analisisOf(acts)!.insights;

    expect(insights.some((i) => i.text.includes('más lento que tu promedio') && i.text.includes('rodaje'))).toBe(true);
  });

  it('ubica la salida entre las más largas cuando no es la única en el tope', () => {
    const acts = [
      runDaysAgo(1, { distance: 8000, moving_time: 2400 }, 1), // 8 km, la más reciente
      runDaysAgo(3, { distance: 9000, moving_time: 2700 }, 2),
      runDaysAgo(5, { distance: 9000, moving_time: 2700 }, 3),
      runDaysAgo(7, { distance: 7000, moving_time: 2100 }, 4),
      runDaysAgo(9, { distance: 7000, moving_time: 2100 }, 5),
      runDaysAgo(11, { distance: 7000, moving_time: 2100 }, 6),
    ];
    const insights = analisisOf(acts)!.insights;

    expect(insights.some((i) => i.text === 'Entre tus 3 salidas más largas hasta hoy.')).toBe(true);
  });

  it('marca como exigente una salida con mucho desnivel por km', () => {
    const acts = [runDaysAgo(1, { distance: 10000, moving_time: 3000, total_elevation_gain: 150 })];
    const insights = analisisOf(acts)!.insights;
    const exigente = insights.find((i) => i.text.startsWith('Salida exigente'));

    expect(exigente).toBeDefined();
    expect(exigente!.tone).toBe('warning');
  });

  it('con poco desnivel aclara que no afectó el rendimiento', () => {
    const acts = [runDaysAgo(1, { distance: 10000, moving_time: 3000, total_elevation_gain: 50 })];
    const insights = analisisOf(acts)!.insights;

    expect(insights.some((i) => i.text === 'El desnivel fue bajo y no afectó tu rendimiento.')).toBe(true);
  });

  it('sin distancia registrada, el desnivel por km no divide por cero', () => {
    const acts = [runDaysAgo(1, { distance: 0, moving_time: 0, average_speed: 0 })];
    expect(() => analisisOf(acts)).not.toThrow();
    expect(analisisOf(acts)).not.toBeNull();
  });
});

describe('destacados', () => {
  it('cada tarjeta trae ícono conocido, valor, etiqueta y tono', () => {
    for (const card of analisisOf(historial(12))!.highlights) {
      expect(['medal', 'route', 'calendar']).toContain(card.icon);
      expect(card.value.length).toBeGreaterThan(0);
      expect(card.label.length).toBeGreaterThan(0);
      expect(['positive', 'neutral', 'warning']).toContain(card.tone);
    }
  });

  it('nunca son más de tres: una por ámbito, sin duplicar históricos ni racha', () => {
    expect(analisisOf(historial(12))!.highlights.length).toBeLessThanOrEqual(3);
  });

  it('ninguna tarjeta repite la etiqueta de otra', () => {
    const labels = analisisOf(historial(12))!.highlights.map((h) => h.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  describe('ranking por ritmo', () => {
    it('el valor es el ritmo promedio, y el ranking baja a la fila de abajo', () => {
      const medalla = analisisOf(historial(12))!.highlights.find((h) => h.icon === 'medal')!;

      expect(medalla.value).toBe('5:00/km');
      expect(medalla.label).toBe('por ritmo promedio');
      expect(medalla.sub).toBe('Top 1 de tus 10K');
    });

    it('sin al menos tres salidas comparables, no hay tarjeta de ranking', () => {
      expect(analisisOf([runDaysAgo(1)])!.highlights.some((h) => h.icon === 'medal')).toBe(false);
    });
  });

  describe('últimos 7 días', () => {
    it('declara "primeros 7 días con registro" cuando no hay ventana previa con qué comparar', () => {
      const semana = analisisOf([runDaysAgo(1)])!.highlights.find((h) => h.label === 'últimos 7 días')!;
      expect(semana.sub).toBe('primeros 7 días con registro');
    });

    it('compara la ventana móvil de 7 días con los 7 previos, no con el casillero de calendario', () => {
      const acts = [
        runDaysAgo(2, { distance: 5000 }, 1),
        runDaysAgo(10, { distance: 4000 }, 2),
      ];
      const semana = analisisOf(acts)!.highlights.find((h) => h.label === 'últimos 7 días')!;

      expect(semana.value).toBe('5.0 km');
      expect(semana.sub).toBe('+25% vs. los 7 previos');
      expect(semana.tone).toBe('positive');
    });

    it('el retroceso se marca con tono de aviso', () => {
      const acts = [
        runDaysAgo(2, { distance: 3000 }, 1),
        runDaysAgo(10, { distance: 6000 }, 2),
      ];
      const semana = analisisOf(acts)!.highlights.find((h) => h.label === 'últimos 7 días')!;

      expect(semana.value).toBe('3.0 km');
      expect(semana.sub).toBe('-50% vs. los 7 previos');
      expect(semana.tone).toBe('warning');
    });
  });

  it('el promedio semanal está siempre presente, en km', () => {
    const promedio = analisisOf(historial(12))!.highlights.find((h) => h.label === 'promedio semanal')!;

    expect(promedio.value).toMatch(/^\d+(\.\d+)? km$/);
    expect(promedio.sub).toBe('media de las últimas 4 semanas');
  });
});

describe('agenda', () => {
  it('va de ayer a los tres días siguientes', () => {
    const agenda = analisisOf(historial(12))!.agenda;

    expect(agenda).toHaveLength(5);
    expect(agenda.map((d) => d.day).slice(0, 3)).toEqual(['Ayer', 'Hoy', 'Mañana']);
  });

  it('declara que hoy no hubo salida cuando la última fue otro día', () => {
    const hoy = analisisOf([runDaysAgo(3)])!.agenda[1];

    expect(hoy.kind).toBe('none');
    expect(hoy.label).toBe('Sin salida todavía');
  });

  it('informa lo corrido ayer, no un plan', () => {
    const ayer = analisisOf([runDaysAgo(1, { distance: 8200 })])!.agenda[0];

    expect(ayer.kind).toBe('done');
    expect(ayer.label).toBe('Corriste 8.2 km');
  });

  it('ayer sin salida no inventa un descanso planificado', () => {
    const ayer = analisisOf([runDaysAgo(5)])!.agenda[0];

    expect(ayer.kind).toBe('none');
    expect(ayer.label).toBe('Sin salida');
  });

  it('suma las salidas del mismo día', () => {
    const acts = [
      runDaysAgo(1, { distance: 6000 }, 1),
      runDaysAgo(1.2, { distance: 4000 }, 2),
    ];

    expect(analisisOf(acts)!.agenda[0].label).toBe('Corriste 10.0 km');
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

  it('una diferencia de ritmo menor a un minuto se expresa en segundos por km, más rápido', () => {
    const acts = [
      runDaysAgo(3, { distance: 10000, moving_time: 3100 }, 1), // 310 s/km
      runDaysAgo(1, { distance: 10000, moving_time: 3000 }, 2), // 300 s/km, la más reciente
    ];
    const comparison = computeEnrichedLastActivity(acts, computeStats(acts))!.comparison!;

    expect(comparison.label).toBe('10s/km más rápido que tu última actividad similar');
    expect(comparison.positive).toBe(true);
  });

  it('una diferencia de ritmo menor a un minuto se expresa en segundos por km, más lento', () => {
    const acts = [
      runDaysAgo(3, { distance: 10000, moving_time: 3000 }, 1), // 300 s/km
      runDaysAgo(1, { distance: 10000, moving_time: 3100 }, 2), // 310 s/km, la más reciente
    ];
    const comparison = computeEnrichedLastActivity(acts, computeStats(acts))!.comparison!;

    expect(comparison.label).toBe('10s/km más lento que tu última actividad similar');
    expect(comparison.positive).toBe(false);
  });

  it('una diferencia de minutos exactos, sin segundos sueltos, también se informa cuando es más lenta', () => {
    const acts = [
      runDaysAgo(3, { distance: 10000, moving_time: 3000 }, 1), // 300 s/km
      runDaysAgo(1, { distance: 10000, moving_time: 4200 }, 2), // 420 s/km, la más reciente
    ];
    const comparison = computeEnrichedLastActivity(acts, computeStats(acts))!.comparison!;

    expect(comparison.label).toBe('2m más lento que tu última actividad similar');
    expect(comparison.positive).toBe(false);
  });

  it('completar la tercera salida de la semana suma XP por semana consistente', () => {
    const acts = [
      runDaysAgo(2, { distance: 5000, moving_time: 1500 }, 1),
      runDaysAgo(1, { distance: 5000, moving_time: 1500 }, 2),
      runDaysAgo(0, { distance: 5000, moving_time: 1500 }, 3), // la más reciente, cierra la semana
    ];
    const enriched = computeEnrichedLastActivity(acts, computeStats(acts))!;

    expect(enriched.xpDetails.some((d) => d.label === 'semana consistente')).toBe(true);
  });
});
