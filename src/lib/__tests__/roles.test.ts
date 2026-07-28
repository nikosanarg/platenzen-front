/**
 * Sistema de roles: cuatro ramas independientes (distancia, velocidad,
 * exploración, logros), cada una con su nivel y su afinidad 0–100. El rol
 * primario es el de nivel más alto, y ante empate el de mayor afinidad.
 *
 * Lo que se verifica es el nivel que otorga cada combinación de datos y que la
 * afinidad esté siempre acotada: un rol regalado o una afinidad de 143% le
 * miente al corredor sobre dónde está parado.
 */
import {
  BRANCH_ROLES,
  OBJECTIVE_TO_BRANCH,
  RoleObjective,
  computeAdnScores,
  computeObjectiveAfinidad,
  computeObjectiveChecklist,
  computeRoles,
} from '@/lib/roles';
import { computeStats } from '@/lib/stats';
import { ProcessedStats, WeeklyStats } from '@/types/stats';
import { activity } from '@/__tests__/helpers/activity';
import { StravaActivity } from '@/types/strava';

const weeks = (count: number, km: number, activityCount = 3): WeeklyStats[] =>
  Array.from({ length: count }, (_, i) => ({
    week: `2026-W${String(i + 1).padStart(2, '0')}`,
    label: '',
    distance: km,
    count: activityCount,
  }));

const statsWith = (over: Partial<ProcessedStats> = {}): ProcessedStats => ({
  ...computeStats([]),
  ...over,
});

/** `count` corridas de `km`, del tipo indicado. */
const runs = (count: number, km: number, sport = 'Run'): StravaActivity[] =>
  Array.from({ length: count }, (_, i) =>
    activity({
      id: i + 1,
      sport_type: sport,
      type: sport,
      distance: km * 1000,
      moving_time: Math.round(km * 300),
    }),
  );

const branchOf = (acts: StravaActivity[], stats: ProcessedStats, branch: string) =>
  computeRoles(acts, stats).branches.find((b) => b.branch === branch)!;

describe('definiciones de roles', () => {
  it('cada rama tiene sus roles con niveles crecientes desde 0', () => {
    for (const roles of Object.values(BRANCH_ROLES)) {
      expect(roles[0].level).toBe(0);
      roles.forEach((r, i) => expect(r.level).toBe(i));
    }
  });

  it('cada objetivo apunta a una rama existente', () => {
    for (const branch of Object.values(OBJECTIVE_TO_BRANCH)) {
      expect(BRANCH_ROLES[branch]).toBeDefined();
    }
  });
});

describe('rama de distancia', () => {
  it('arranca en Amateur sin datos', () => {
    const b = branchOf([], statsWith(), 'distance');

    expect(b.currentRole.id).toBe('amateur');
    expect(b.nextRole?.id).toBe('fondista');
  });

  it('sube a Fondista con 15 km semanales de promedio', () => {
    const b = branchOf(runs(5, 5), statsWith({ weeklyAvgDistance: 15 }), 'distance');
    expect(b.currentRole.id).toBe('fondista');
  });

  it('también sube a Fondista con una sola salida de 15 km', () => {
    const b = branchOf(runs(1, 15), statsWith({ weeklyAvgDistance: 5 }), 'distance');
    expect(b.currentRole.id).toBe('fondista');
  });

  it('Ultrafondista exige volumen Y una salida de media maratón', () => {
    const soloVolumen = branchOf(runs(5, 10), statsWith({ weeklyAvgDistance: 40 }), 'distance');
    expect(soloVolumen.currentRole.id).toBe('fondista');

    const ambos = branchOf(runs(5, 21.1), statsWith({ weeklyAvgDistance: 40 }), 'distance');
    expect(ambos.currentRole.id).toBe('ultrafondista');
  });

  it('Maratonista con una maratón completa, sin importar el volumen', () => {
    const b = branchOf(runs(1, 42.195), statsWith({ weeklyAvgDistance: 5 }), 'distance');

    expect(b.currentRole.id).toBe('maratonista');
    expect(b.nextRole).toBeNull();
    expect(b.howToProgress).toBeNull();
  });

  it('42 km redondos no alcanzan para Maratonista', () => {
    const b = branchOf(runs(1, 42), statsWith({ weeklyAvgDistance: 5 }), 'distance');
    expect(b.currentRole.id).not.toBe('maratonista');
  });

  it('explica el rol actual y cómo seguir, salvo en el último', () => {
    const amateur = branchOf([], statsWith(), 'distance');

    expect(amateur.whyCurrentRole.length).toBeGreaterThan(0);
    expect(amateur.howToProgress).toContain('Fondista');
  });
});

describe('rama de velocidad', () => {
  it('arranca en Corredor sin ritmo registrado', () => {
    const b = branchOf([], statsWith(), 'speed');

    expect(b.currentRole.id).toBe('corredor');
    expect(b.whyCurrentRole).toContain('—');
  });

  it('Pasadista por debajo de 5:00/km', () => {
    expect(branchOf(runs(3, 5), statsWith({ bestPace: 299 }), 'speed').currentRole.id).toBe('pasadista');
  });

  it('5:00/km exactos no alcanzan: el umbral es estricto', () => {
    expect(branchOf(runs(3, 5), statsWith({ bestPace: 300 }), 'speed').currentRole.id).toBe('corredor');
  });

  it('Velocista por debajo de 4:30/km', () => {
    const b = branchOf(runs(3, 5), statsWith({ bestPace: 269 }), 'speed');

    expect(b.currentRole.id).toBe('velocista');
    expect(b.nextRole).toBeNull();
  });

  it('muestra el mejor ritmo formateado', () => {
    const b = branchOf(runs(3, 5), statsWith({ bestPace: 285 }), 'speed');
    expect(b.whyCurrentRole).toContain('4:45/km');
  });

  it('la frecuencia semanal suma afinidad', () => {
    const pocas = branchOf(runs(3, 5), statsWith({ bestPace: 300, weekly: weeks(12, 20, 1) }), 'speed');
    const muchas = branchOf(runs(3, 5), statsWith({ bestPace: 300, weekly: weeks(12, 20, 5) }), 'speed');

    expect(muchas.afinidad).toBeGreaterThan(pocas.afinidad);
  });
});

describe('rama de exploración', () => {
  it('arranca en Explorador', () => {
    expect(branchOf([], statsWith(), 'exploration').currentRole.id).toBe('explorador');
  });

  it('Trotamundos por km acumulados', () => {
    const b = branchOf(runs(10, 30), statsWith({ totalDistance: 300 }), 'exploration');
    expect(b.currentRole.id).toBe('trotamundos');
  });

  it('Trotamundos por proporción de trail', () => {
    const acts = [...runs(2, 10, 'TrailRun'), ...runs(8, 10).map((a, i) => ({ ...a, id: 100 + i }))];
    const b = branchOf(acts, statsWith({ totalDistance: 100 }), 'exploration');

    expect(b.currentRole.id).toBe('trotamundos');
  });

  it('Conquistador exige trail Y km, no uno solo', () => {
    const soloKm = branchOf(runs(10, 50), statsWith({ totalDistance: 500 }), 'exploration');
    expect(soloKm.currentRole.id).toBe('trotamundos');

    const acts = [...runs(3, 50, 'TrailRun'), ...runs(7, 50).map((a, i) => ({ ...a, id: 100 + i }))];
    const ambos = branchOf(acts, statsWith({ totalDistance: 500 }), 'exploration');
    expect(ambos.currentRole.id).toBe('conquistador');
  });

  it('concuerda el singular y el plural de "lugares distintos"', () => {
    const b = branchOf([], statsWith(), 'exploration');
    expect(b.whyCurrentRole).toContain('0 lugares distintos');
  });
});

describe('rama de logros', () => {
  it('arranca en Competidor', () => {
    expect(branchOf([], statsWith(), 'achievement').currentRole.id).toBe('competidor');
  });

  it('Coleccionador exige actividades, hitos y km a la vez', () => {
    const stats = statsWith({ totalActivities: 50, totalDistance: 500 });
    const b = branchOf(runs(50, 21.1), stats, 'achievement');

    expect(b.currentRole.id).toBe('coleccionador');
  });

  it('con actividades pero sin km suficientes se queda en Competidor', () => {
    const stats = statsWith({ totalActivities: 50, totalDistance: 100 });
    expect(branchOf(runs(50, 21.1), stats, 'achievement').currentRole.id).toBe('competidor');
  });

  it('Medallista exige los 6 hitos incluida la media maratón', () => {
    const stats = statsWith({ totalActivities: 100, totalDistance: 1000 });
    const b = branchOf(runs(100, 42.195), stats, 'achievement');

    expect(b.currentRole.id).toBe('medallista');
    expect(b.nextRole).toBeNull();
  });

  it('sin la media maratón no llega a Medallista', () => {
    const stats = statsWith({ totalActivities: 100, totalDistance: 1000 });
    expect(branchOf(runs(100, 15), stats, 'achievement').currentRole.id).not.toBe('medallista');
  });

  it('concuerda el plural de "hitos"', () => {
    const unHito = branchOf(runs(1, 5), statsWith({ totalActivities: 1 }), 'achievement');
    expect(unHito.whyCurrentRole).toContain('1 hito de distancia desbloqueado');
  });
});

describe('afinidad', () => {
  it('está siempre entre 0 y 100 en todas las ramas', () => {
    const escenarios: Array<[StravaActivity[], ProcessedStats]> = [
      [[], statsWith()],
      [runs(100, 42.195), statsWith({ weeklyAvgDistance: 200, bestPace: 180, totalDistance: 9000, totalActivities: 500 })],
      [runs(5, 5), statsWith({ weeklyAvgDistance: 10, bestPace: 400, totalDistance: 50, totalActivities: 5 })],
    ];

    for (const [acts, stats] of escenarios) {
      for (const b of computeRoles(acts, stats).branches) {
        expect(b.afinidad).toBeGreaterThanOrEqual(0);
        expect(b.afinidad).toBeLessThanOrEqual(100);
      }
    }
  });

  it('es 0 en todas las ramas sin ningún dato', () => {
    for (const b of computeRoles([], statsWith()).branches) {
      expect(b.afinidad).toBe(0);
    }
  });
});

describe('computeRoles: orden de las ramas', () => {
  it('devuelve las cuatro ramas', () => {
    expect(computeRoles([], statsWith()).branches).toHaveLength(4);
  });

  it('el primario es el de nivel más alto', () => {
    const roles = computeRoles(runs(1, 42.195), statsWith({ weeklyAvgDistance: 5 }));

    expect(roles.primary.branch).toBe('distance');
    expect(roles.primary.currentRole.level).toBe(3);
  });

  it('ordena primario, secundario y terciario por nivel descendente', () => {
    const roles = computeRoles(runs(10, 42.195), statsWith({ weeklyAvgDistance: 40, bestPace: 260, totalDistance: 500 }));

    expect(roles.primary.currentRole.level).toBeGreaterThanOrEqual(roles.secondary!.currentRole.level);
    expect(roles.secondary!.currentRole.level).toBeGreaterThanOrEqual(roles.tertiary!.currentRole.level);
  });

  it('ante empate de nivel desempata por afinidad', () => {
    const roles = computeRoles([], statsWith());
    const empatados = roles.branches.filter((b) => b.currentRole.level === roles.primary.currentRole.level);

    if (empatados.length > 1) {
      expect(roles.primary.afinidad).toBeGreaterThanOrEqual(roles.secondary!.afinidad);
    }
  });
});

describe('computeAdnScores', () => {
  it('todo en 0 sin datos', () => {
    expect(computeAdnScores([], statsWith())).toEqual({
      resistencia: 0, velocidad: 0, consistencia: 0, exploracion: 0, logros: 0,
    });
  });

  it('los cinco ejes quedan entre 0 y 100', () => {
    const scores = computeAdnScores(
      runs(500, 42.195, 'TrailRun'),
      statsWith({ weeklyAvgDistance: 300, bestPace: 150, totalDistance: 20000, totalActivities: 2000, weekly: weeks(12, 100) }),
    );

    for (const value of Object.values(scores)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it('resistencia satura a los 50 km semanales', () => {
    expect(computeAdnScores([], statsWith({ weeklyAvgDistance: 25 })).resistencia).toBe(50);
    expect(computeAdnScores([], statsWith({ weeklyAvgDistance: 50 })).resistencia).toBe(100);
    expect(computeAdnScores([], statsWith({ weeklyAvgDistance: 80 })).resistencia).toBe(100);
  });

  it('velocidad es 0 con ritmo peor que 7:00/km', () => {
    expect(computeAdnScores([], statsWith({ bestPace: 420 })).velocidad).toBe(0);
    expect(computeAdnScores([], statsWith({ bestPace: 500 })).velocidad).toBe(0);
  });

  it('velocidad llega a 100 a los 4:00/km', () => {
    expect(computeAdnScores([], statsWith({ bestPace: 240 })).velocidad).toBe(100);
    expect(computeAdnScores([], statsWith({ bestPace: 200 })).velocidad).toBe(100);
  });

  it('consistencia es la proporción de semanas activas de las últimas 12', () => {
    const weekly = [...weeks(6, 20), ...weeks(6, 0)];
    expect(computeAdnScores([], statsWith({ weekly })).consistencia).toBe(50);
  });
});

describe('computeObjectiveAfinidad', () => {
  it('devuelve la afinidad de la rama del objetivo', () => {
    const stats = statsWith({ weeklyAvgDistance: 30 });
    const roles = computeRoles(runs(5, 20), stats);

    const distancia = roles.branches.find((b) => b.branch === 'distance')!;
    expect(computeObjectiveAfinidad('maratonista', roles).afinidad).toBe(distancia.afinidad);
  });

  it('cada objetivo resuelve contra su propia rama', () => {
    const roles = computeRoles([], statsWith());

    for (const objetivo of Object.keys(OBJECTIVE_TO_BRANCH) as RoleObjective[]) {
      const esperada = roles.branches.find((b) => b.branch === OBJECTIVE_TO_BRANCH[objetivo])!;
      expect(computeObjectiveAfinidad(objetivo, roles).afinidad).toBe(esperada.afinidad);
    }
  });
});

describe('computeObjectiveChecklist', () => {
  it('devuelve items con etiqueta y estado para cada objetivo', () => {
    for (const objetivo of Object.keys(OBJECTIVE_TO_BRANCH) as RoleObjective[]) {
      const items = computeObjectiveChecklist(objetivo, [], statsWith());

      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.label.length).toBeGreaterThan(0);
        expect(typeof item.passed).toBe('boolean');
      }
    }
  });

  it('sin datos no aprueba ningún requisito', () => {
    const items = computeObjectiveChecklist('maratonista', [], statsWith());
    expect(items.every((i) => !i.passed)).toBe(true);
  });

  it('marca cumplidos los requisitos de distancia alcanzados', () => {
    const items = computeObjectiveChecklist(
      'maratonista',
      runs(1, 42.195),
      statsWith({ weeklyAvgDistance: 40 }),
    );

    expect(items.every((i) => i.passed)).toBe(true);
  });

  it('el objetivo de velocista tiene los dos umbrales de ritmo', () => {
    const items = computeObjectiveChecklist('velocista', [], statsWith({ bestPace: 290 }));

    expect(items).toHaveLength(2);
    expect(items[0].passed).toBe(true);  // < 5:00
    expect(items[1].passed).toBe(false); // < 4:30
  });

  it('las etiquetas de ritmo se escriben como umbral', () => {
    const items = computeObjectiveChecklist('velocista', [], statsWith());
    expect(items[0].label).toBe('<5:00/km');
  });
});
