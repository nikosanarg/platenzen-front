/**
 * ADN del corredor: cinco atributos 0–100 que alimentan el spider chart. Cada
 * uno tiene su propia ventana temporal (12 meses o 30 días) y su propia escala
 * de normalización, y los tooltips le muestran la fórmula al usuario. Si el
 * puntaje y el tooltip se desalinean, el producto explica una cuenta que no hizo.
 */
import { computeRunnerDNA, getRunnerDNATooltips } from '@/lib/runnerDNA';
import { computeStats } from '@/lib/stats';
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

function runDaysAgo(days: number, over: Partial<Activity> = {}, id = 1): Activity {
  const iso = new Date(NOW.getTime() - days * 86400000).toISOString();
  return activity({ id, start_date: iso, start_date_local: iso, ...over });
}

const dnaOf = (acts: Activity[]) => computeRunnerDNA(acts, computeStats(acts));

describe('computeRunnerDNA sin datos', () => {
  it('devuelve los cinco atributos en 0', () => {
    expect(dnaOf([])).toEqual({
      resistencia: 0, velocidad: 0, consistencia: 0, exploracion: 0, logros: 0,
    });
  });

  it('ignora lo que no es running', () => {
    const dna = dnaOf([runDaysAgo(1, { sport_type: 'Ride', type: 'Ride', distance: 40000 })]);

    expect(dna.resistencia).toBe(0);
    expect(dna.velocidad).toBe(0);
    expect(dna.consistencia).toBe(0);
  });

  it('cuenta como running una salida con sport_type vacío, usando el type como respaldo', () => {
    const dna = dnaOf([runDaysAgo(1, { sport_type: '', type: 'Run', distance: 5000, moving_time: 1500 })]);

    expect(dna.resistencia).toBeGreaterThan(0);
    expect(dna.consistencia).toBeGreaterThan(0);
  });
});

describe('todos los atributos quedan acotados', () => {
  it('entre 0 y 100 incluso con datos extremos', () => {
    const acts = Array.from({ length: 60 }, (_, i) =>
      runDaysAgo(i * 0.5, { distance: 100000, moving_time: 10000 }, i + 1),
    );

    for (const value of Object.values(dnaOf(acts))) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});

describe('resistencia', () => {
  it('llega a 100 con una maratón, que es el techo de la escala', () => {
    const dna = dnaOf([runDaysAgo(1, { distance: 42195, moving_time: 14000 })]);
    expect(dna.resistencia).toBe(100);
  });

  it('pondera más la distancia máxima que el promedio', () => {
    // Mismo promedio, distinto máximo.
    const parejo = dnaOf([
      runDaysAgo(1, { distance: 20000, moving_time: 6000 }, 1),
      runDaysAgo(2, { distance: 20000, moving_time: 6000 }, 2),
    ]);
    const dispar = dnaOf([
      runDaysAgo(1, { distance: 35000, moving_time: 10500 }, 1),
      runDaysAgo(2, { distance: 5000, moving_time: 1500 }, 2),
    ]);

    expect(dispar.resistencia).toBeGreaterThan(parejo.resistencia);
  });

  it('ignora lo de más de 12 meses atrás', () => {
    expect(dnaOf([runDaysAgo(400, { distance: 42195, moving_time: 14000 })]).resistencia).toBe(0);
  });
});

describe('velocidad', () => {
  it('es 0 con ritmos peores que 12:00/km', () => {
    // 5 km en 4000 s = 13:20/km.
    expect(dnaOf([runDaysAgo(1, { distance: 5000, moving_time: 4000 })]).velocidad).toBe(0);
  });

  it('sube cuando el ritmo mejora', () => {
    const lento = dnaOf([runDaysAgo(1, { distance: 5000, moving_time: 2100 })]);
    const rapido = dnaOf([runDaysAgo(1, { distance: 5000, moving_time: 1200 })]);

    expect(rapido.velocidad).toBeGreaterThan(lento.velocidad);
  });

  it('descarta las salidas de menos de 1 km', () => {
    expect(dnaOf([runDaysAgo(1, { distance: 500, moving_time: 100 })]).velocidad).toBe(0);
  });

  it('descarta las salidas sin velocidad registrada', () => {
    expect(dnaOf([runDaysAgo(1, { distance: 5000, moving_time: 1500, average_speed: 0 })]).velocidad).toBe(0);
  });
});

describe('consistencia', () => {
  it('cuenta días distintos de los últimos 30', () => {
    const acts = Array.from({ length: 15 }, (_, i) => runDaysAgo(i, { distance: 5000 }, i + 1));
    expect(dnaOf(acts).consistencia).toBe(50);
  });

  it('dos salidas el mismo día cuentan como un día', () => {
    const acts = [
      runDaysAgo(1, { distance: 5000 }, 1),
      runDaysAgo(1, { distance: 6000 }, 2),
    ];

    expect(dnaOf(acts).consistencia).toBe(dnaOf([acts[0]]).consistencia);
  });

  it('no cuenta lo de más de 30 días atrás', () => {
    expect(dnaOf([runDaysAgo(40, { distance: 5000 })]).consistencia).toBe(0);
  });

  it('30 días distintos dan 100', () => {
    const acts = Array.from({ length: 30 }, (_, i) => runDaysAgo(i, { distance: 5000 }, i + 1));
    expect(dnaOf(acts).consistencia).toBe(100);
  });
});

describe('logros', () => {
  it('es la proporción de logros desbloqueados sobre el total', () => {
    const sinNada = dnaOf([]);
    const conAlgo = dnaOf([runDaysAgo(1, { distance: 21097.5, moving_time: 7000 })]);

    expect(sinNada.logros).toBe(0);
    expect(conAlgo.logros).toBeGreaterThan(0);
    expect(conAlgo.logros).toBeLessThan(100);
  });

  it('cuenta el historial completo, no sólo los últimos 12 meses', () => {
    const viejo = dnaOf([runDaysAgo(400, { distance: 21097.5, moving_time: 7000 })]);
    expect(viejo.logros).toBeGreaterThan(0);
  });
});

describe('getRunnerDNATooltips', () => {
  const dna = { resistencia: 80, velocidad: 60, consistencia: 40, exploracion: 20, logros: 35 };
  const tooltips = getRunnerDNATooltips(dna);

  it('devuelve un tooltip por atributo', () => {
    expect(Object.keys(tooltips).sort()).toEqual(
      ['consistencia', 'exploracion', 'logros', 'resistencia', 'velocidad'],
    );
  });

  it('cada tooltip muestra el puntaje sobre 100', () => {
    expect(tooltips.resistencia).toContain('80/100');
    expect(tooltips.velocidad).toContain('60/100');
    expect(tooltips.consistencia).toContain('40/100');
    expect(tooltips.exploracion).toContain('20/100');
    expect(tooltips.logros).toContain('35/100');
  });

  it('explica la escala de normalización, que es lo que no se adivina', () => {
    expect(tooltips.resistencia).toContain('42,195 km = 100');
    expect(tooltips.velocidad).toContain('12:00/km = 0');
    expect(tooltips.consistencia).toContain('30 días = 100');
    expect(tooltips.exploracion).toContain('25 lugares = 100');
  });

  it('la tolerancia de 500 m entre puntos de partida queda declarada', () => {
    expect(tooltips.exploracion).toContain('500 m');
  });
});
