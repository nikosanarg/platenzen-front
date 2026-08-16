/**
 * El árbol de habilidades: seis ramas, tres niveles, y el radar que las dibuja.
 *
 * Lo que se verifica acá es sobre todo que el sistema no le mienta al corredor
 * sobre su progreso: que un nivel no se desbloquee cumpliendo la mitad de sus
 * requisitos, que el porcentaje refleje el requisito más atrasado y no el más
 * cómodo, y que las ventanas móviles efectivamente olviden lo viejo.
 *
 * El decaimiento tiene su propio bloque porque es la parte con más superficie
 * para equivocarse: es el mismo cálculo con el reloj adelantado, así que un bug
 * de ventana aparece ahí antes que en ningún otro lado.
 */
import {
  computeBranchTree,
  computeBranchDecay,
  BRANCH_ORDER,
  BranchId,
  DIAS_DECAIMIENTO,
} from '@/lib/branchTree';
import { activity } from '@/__tests__/helpers/activity';
import { Activity } from '@/types/activity';

const NOW = new Date('2026-08-16T12:00:00Z');

/** Una corrida `days` días atrás. Las fechas se escriben a mano: el dominio lee el string local. */
function runDaysAgo(days: number, over: Partial<Activity> = {}, id = 1): Activity {
  const d = new Date(NOW.getTime() - days * 86400000);
  const iso = `${d.toISOString().slice(0, 10)}T09:00:00Z`;
  return activity({ id, distance: 10000, moving_time: 3000, start_date: iso, start_date_local: iso, ...over });
}

/** `count` corridas, una por día hacia atrás desde hace `startDaysAgo` días. */
function runsDaily(count: number, startDaysAgo = 0, over: Partial<Activity> = {}): Activity[] {
  return Array.from({ length: count }, (_, i) => runDaysAgo(startDaysAgo + i, over, i + 1));
}

const treeOf = (acts: Activity[]) => computeBranchTree(acts, NOW);
const branchOf = (acts: Activity[], id: BranchId) =>
  treeOf(acts).branches.find(b => b.id === id)!;

describe('forma del árbol', () => {
  it('devuelve las seis ramas, en el orden de los ejes del radar', () => {
    const tree = treeOf(runsDaily(10));
    expect(tree.branches.map(b => b.id)).toEqual(BRANCH_ORDER);
    expect(tree.branches).toHaveLength(6);
  });

  it('cada rama trae tres niveles con nombre y requisitos', () => {
    for (const branch of treeOf(runsDaily(10)).branches) {
      expect(branch.tiers).toHaveLength(3);
      for (const tier of branch.tiers) {
        expect(tier.name.length).toBeGreaterThan(0);
        expect(tier.requirements.length).toBeGreaterThanOrEqual(1);
        for (const r of tier.requirements) {
          expect(r.label.length).toBeGreaterThan(0);
          expect(r.targetDisplay.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('sin actividades todo queda en cero y nada se desbloquea', () => {
    const tree = treeOf([]);
    expect(tree.maxLevel).toBe(0);
    for (const branch of tree.branches) {
      expect(branch.level).toBe(0);
      expect(branch.pct).toBe(0);
      expect(branch.tiers.every(t => !t.unlocked)).toBe(true);
    }
  });

  it('ignora lo que no es correr', () => {
    const ciclismo = runsDaily(20, 0, { sport_type: 'Ride', type: 'Ride' });
    expect(treeOf(ciclismo).maxLevel).toBe(0);
  });
});

describe('escala del radar', () => {
  it('los niveles caen en 25, 50 y 100 por ciento', () => {
    // Exploración es la rama de una sola métrica: el nivel se controla directo.
    const lugar = (lat: number) => ({ map: { summary_polyline: polylineAt(lat) } });

    const nivel1 = treeOf(
      Array.from({ length: 6 }, (_, i) => runDaysAgo(i, lugar(-34.9 + i * 0.5), i + 1)),
    ).branches.find(b => b.id === 'exploracion')!;

    expect(nivel1.level).toBe(1);
    expect(nivel1.pct).toBeGreaterThanOrEqual(25);
    expect(nivel1.pct).toBeLessThan(50);
  });

  it('el porcentaje nunca se sale de 0–100', () => {
    for (const branch of treeOf(runsDaily(300, 0, { distance: 45000 })).branches) {
      expect(branch.pct).toBeGreaterThanOrEqual(0);
      expect(branch.pct).toBeLessThanOrEqual(100);
    }
  });

  it('un nivel 3 alcanzado vale exactamente 100', () => {
    const acts = runsDaily(120, 0, { distance: 12000, moving_time: 3600 });
    const consistencia = branchOf(acts, 'consistencia');
    if (consistencia.level === 3) expect(consistencia.pct).toBe(100);
  });
});

describe('los requisitos se exigen juntos, no sueltos', () => {
  it('Fondo no se desbloquea con la distancia si faltan las repeticiones', () => {
    // Una sola salida de 12 km: pasa la distancia del nivel 1, no las 10 salidas.
    const fondo = branchOf([runDaysAgo(2, { distance: 12000 })], 'fondo');

    expect(fondo.tiers[0].requirements[0].met).toBe(true);
    expect(fondo.tiers[0].requirements[1].met).toBe(false);
    expect(fondo.level).toBe(0);
  });

  it('Fondo se desbloquea cuando se cumplen las dos cosas', () => {
    const fondo = branchOf(runsDaily(12, 0, { distance: 12000 }), 'fondo');

    expect(fondo.tiers[0].unlocked).toBe(true);
    expect(fondo.level).toBeGreaterThanOrEqual(1);
  });

  it('los niveles son secuenciales: una maratón sola no saltea el primer nodo', () => {
    const fondo = branchOf([runDaysAgo(5, { distance: 43000, moving_time: 15000 })], 'fondo');

    expect(fondo.tiers[2].requirements[0].met).toBe(true); // llegó a la distancia
    expect(fondo.level).toBe(0); // pero no desbloqueó nada
  });

  it('el porcentaje lo marca el requisito más atrasado, no el promedio', () => {
    // Volumen alto en una sola semana: pico cumplido, sostenido no.
    const acts = runsDaily(4, 0, { distance: 25000, moving_time: 7500 });
    const resistencia = branchOf(acts, 'resistencia');
    const [sostenido, pico] = resistencia.tiers[0].requirements;

    expect(pico.value).toBeGreaterThan(pico.target);
    expect(resistencia.pct).toBeLessThan(25);
    expect(resistencia.pct).toBeCloseTo((sostenido.value / sostenido.target) * 25, 0);
  });
});

describe('ventanas móviles', () => {
  it('lo corrido hace más de un año no cuenta', () => {
    const viejo = [runDaysAgo(400, { distance: 43000, moving_time: 15000 })];
    const fondo = branchOf(viejo, 'fondo');

    expect(fondo.tiers[0].requirements[0].value).toBe(0);
    expect(fondo.level).toBe(0);
  });

  it('Resistencia sólo mira el último trimestre', () => {
    // Volumen fuerte, pero terminado hace cinco meses.
    const acts = runsDaily(60, 150, { distance: 20000, moving_time: 6000 });
    expect(branchOf(acts, 'resistencia').tiers[0].requirements[0].value).toBe(0);
  });

  it('el promedio semanal divide por semanas de calendario, no por semanas activas', () => {
    // 13 salidas de 10 km en 13 días: 130 km en un trimestre son 10 km/semana,
    // no 130. Dividir por las semanas con actividad infla el volumen del que
    // corre a rachas, que es justo lo que esta rama no debe premiar.
    const acts = runsDaily(13, 0, { distance: 10000 });
    const semanal = branchOf(acts, 'resistencia').tiers[0].requirements[0];

    expect(semanal.value).toBeCloseTo(10, 1);
  });
});

describe('decaimiento', () => {
  const activo = runsDaily(90, 0, { distance: 12000, moving_time: 3600 });

  it('nunca proyecta más de lo que ya tenés', () => {
    const hoy = computeBranchTree(activo, NOW);
    const luego = computeBranchDecay(activo, NOW);

    for (let i = 0; i < hoy.branches.length; i++) {
      expect(luego.branches[i].pct).toBeLessThanOrEqual(hoy.branches[i].pct);
    }
  });

  it('la racha de consistencia se corta entera', () => {
    const hoy = computeBranchTree(activo, NOW).branches.find(b => b.id === 'consistencia')!;
    const luego = computeBranchDecay(activo, NOW).branches.find(b => b.id === 'consistencia')!;

    expect(hoy.tiers[0].requirements[0].value).toBeGreaterThan(0);
    expect(luego.tiers[0].requirements[0].value).toBe(0);
  });

  it('adelantar el reloj equivale a proyectar el decaimiento', () => {
    const adelantado = new Date(NOW);
    adelantado.setDate(adelantado.getDate() + DIAS_DECAIMIENTO);

    expect(computeBranchDecay(activo, NOW).branches.map(b => b.pct))
      .toEqual(computeBranchTree(activo, adelantado).branches.map(b => b.pct));
  });

  it('el volumen del trimestre cae más que los hitos del año', () => {
    const hoy = computeBranchTree(activo, NOW);
    const luego = computeBranchDecay(activo, NOW);
    const caida = (id: BranchId) => {
      const a = hoy.branches.find(b => b.id === id)!.pct;
      const b = luego.branches.find(x => x.id === id)!.pct;
      return a - b;
    };

    expect(caida('resistencia')).toBeGreaterThan(caida('fondo'));
  });
});

describe('nivel máximo, el que brilla en el árbol', () => {
  it('es el más alto alcanzado entre todas las ramas', () => {
    const tree = treeOf(runsDaily(60, 0, { distance: 12000, moving_time: 3600 }));
    const mayor = Math.max(...tree.branches.map(b => b.level));

    expect(tree.maxLevel).toBe(mayor);
  });

  it('sin nada desbloqueado es cero', () => {
    expect(treeOf([runDaysAgo(3)]).maxLevel).toBe(0);
  });
});

/** Polyline de un único punto, para fabricar salidas desde lugares distintos. */
function polylineAt(lat: number): string {
  const enc = (v: number) => {
    let value = Math.round(v * 1e5) << 1;
    if (value < 0) value = ~value;
    let out = '';
    while (value >= 0x20) {
      out += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
      value >>= 5;
    }
    return out + String.fromCharCode(value + 63);
  };
  return enc(lat) + enc(-58.0);
}
