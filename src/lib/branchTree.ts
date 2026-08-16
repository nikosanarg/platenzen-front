/**
 * El árbol de habilidades de Platenzen: seis ramas, tres niveles cada una.
 *
 * Reemplaza al sistema anterior de cuatro ramas + radar de cinco ejes, que
 * medían cosas distintas con fórmulas independientes — se podía tener 80% de
 * afinidad en una rama y estar en su primer nivel, y ningún número explicaba al
 * otro. Acá **el radar y el árbol son el mismo cálculo**: el porcentaje de un
 * eje ES la posición en su rama.
 *
 * Las seis ramas responden preguntas que no se pisan:
 *
 * - Resistencia  — cuánto podés sostener.
 * - Fondo        — hasta dónde podés llegar.
 * - Velocidad    — qué tan rápido.
 * - Consistencia — qué tan regularmente entrenás.
 * - Exploración  — cuánto territorio recorrés.
 * - Desnivel     — qué tanto subís.
 *
 * "Logros" quedó afuera a propósito: contaba hitos que ya cuentan las otras
 * ramas, así que inflaba el polígono de cualquiera con historial largo sin
 * agregar información. Los logros son consecuencia del progreso en estas seis,
 * no una rama más.
 *
 * ── Dos reglas que gobiernan todo el módulo ────────────────────────────────
 *
 * **1. Ventanas móviles, no historial completo.** Ninguna métrica mira más allá
 * de los últimos 365 días (Resistencia, sólo 91). Un corredor que registró
 * veinte años y hace cinco que no sale no es un maratonista *hoy*, y el árbol
 * describe el presente. La consecuencia incómoda es deliberada: una maratón
 * corrida hace dos años deja de contar.
 *
 * **2. Todo se calcula contra un `now` inyectable**, y de ahí sale gratis el
 * radar de decaimiento: pedir el árbol con `now + 30 días` sobre las mismas
 * actividades responde "¿qué pierdo si dejo de correr un mes?". Cada ventana se
 * corre sola, así que las métricas cortas se desploman y las largas apenas se
 * mueven — que es exactamente lo que pasa en la realidad. Ojo con una en
 * particular: la racha de Consistencia se va a **cero**, porque un mes sin
 * correr la corta entera. No es un bug, es el aviso más fuerte del sistema.
 */

import { Activity } from '@/types/activity';
import { isRunning } from '@/lib/sports';
import { countDistinctStartingPlaces } from '@/lib/explorationUtils';
import { RADIO_ZONA_KM } from '@/lib/worldMap';
import { HALF_MARATHON_KM, MARATHON_KM } from '@/lib/distances';
import { splitPace } from '@/utils/pace';

// ── Contrato público ────────────────────────────────────────────────────────

export type BranchId =
  | 'resistencia'
  | 'fondo'
  | 'velocidad'
  | 'consistencia'
  | 'exploracion'
  | 'desnivel';

/** Un requisito concreto de un nivel: dónde estás, de dónde venís, adónde vas. */
export interface Requirement {
  label: string;
  /** Valor actual, ya normalizado a "más alto es mejor". */
  value: number;
  /** Piso del tramo (el umbral del nivel anterior, o 0). */
  from: number;
  /** Umbral que hay que alcanzar para este nivel. */
  target: number;
  /** Lo que se muestra: "22,4 km/sem". */
  display: string;
  /** Lo que hay que alcanzar, para mostrar: "35 km/sem". */
  targetDisplay: string;
  met: boolean;
}

export interface Tier {
  level: 1 | 2 | 3;
  name: string;
  /** Los requisitos de ESTE nivel. Exploración trae uno; el resto, dos. */
  requirements: Requirement[];
  unlocked: boolean;
}

export interface BranchSnapshot {
  id: BranchId;
  name: string;
  tagline: string;
  tiers: Tier[];
  /** 0 = ningún nivel alcanzado. */
  level: 0 | 1 | 2 | 3;
  /** 0–100. Los niveles caen en 25 / 50 / 100; adentro del tramo, interpola. */
  pct: number;
}

export interface TreeSnapshot {
  branches: BranchSnapshot[];
  /** El nivel más alto alcanzado en cualquier rama. Es lo que brilla en el árbol. */
  maxLevel: 0 | 1 | 2 | 3;
}

// ── Anclas de la escala ─────────────────────────────────────────────────────

/**
 * Nivel 0 → 0%, nivel 1 → 25%, nivel 2 → 50%, nivel 3 → 100%.
 *
 * La escala es deliberadamente no lineal: si cada nivel ocupara un tercio, un
 * novato llegaría a zonas avanzadas del radar con muy poco y el gráfico dejaría
 * de discriminar justo donde está la mayoría. Que el último tramo valga la
 * mitad del radio es el punto.
 *
 * Adentro de cada tramo se interpola, y eso **no es cosmético**: si el eje sólo
 * pudiera valer 0/25/50/100, perder un mes de actividad casi nunca cambiaría el
 * dibujo y el radar de decaimiento no mostraría nada.
 */
const ANCHORS = [0, 25, 50, 100] as const;

/** Ritmo de referencia (8:00/km) desde el que se empieza a puntuar velocidad. */
const PACE_FLOOR_SEC = 480;

const DIAS_ANIO = 365;
const DIAS_TRIMESTRE = 91;
const SEMANAS_TRIMESTRE = 13;
const SEMANAS_ANIO = 52;
/** Cuánto se adelanta el reloj para proyectar el decaimiento. */
export const DIAS_DECAIMIENTO = 30;

// ── Utilidades de fecha ─────────────────────────────────────────────────────
//
// Se bucketea por el string local (`start_date_local` trae la hora de pared con
// un `Z` que miente, ver types/activity.ts), no por getTime(): construir un Date
// y leer getDay() corre las salidas de madrugada al día anterior.

function localDay(a: Activity): string {
  return a.start_date_local.slice(0, 10);
}

function dayIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/** Semana anclada al lunes. 1970-01-01 fue jueves, de ahí el +3. */
function weekIndex(dateStr: string): number {
  return Math.floor((dayIndex(dateStr) + 3) / 7);
}

function dateStringOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Las corridas dentro de los últimos `days` días contados hacia atrás desde `now`. */
function within(runs: Activity[], now: Date, days: number): Activity[] {
  const end = dayIndex(dateStringOf(now));
  const start = end - days + 1;
  return runs.filter(r => {
    const d = dayIndex(localDay(r));
    return d >= start && d <= end;
  });
}

// ── Formateo ────────────────────────────────────────────────────────────────

function km(n: number, decimals = 1): string {
  return `${n.toFixed(decimals).replace('.', ',')} km`;
}

function kmRound(n: number): string {
  return `${Math.round(n).toLocaleString('es-AR')} km`;
}

function metros(n: number): string {
  return `${Math.round(n).toLocaleString('es-AR')} m`;
}

function paceLabel(secPerKm: number): string {
  if (secPerKm <= 0) return '—';
  const { minutes, seconds } = splitPace(secPerKm);
  return `${minutes}:${seconds}/km`;
}

/** Puntos de velocidad: cuánto le sacaste al ritmo de referencia. Más = mejor. */
function pacePoints(secPerKm: number): number {
  if (secPerKm <= 0) return 0;
  return Math.max(0, PACE_FLOOR_SEC - secPerKm);
}

function salidas(n: number): string {
  return `${n} ${n === 1 ? 'salida' : 'salidas'}`;
}

function semanas(n: number): string {
  return `${n} ${n === 1 ? 'semana' : 'semanas'}`;
}

// ── Métricas crudas ─────────────────────────────────────────────────────────

function paceSecPerKm(a: Activity): number {
  return a.average_speed > 0 ? 1000 / a.average_speed : 0;
}

function totalKm(runs: Activity[]): number {
  return runs.reduce((s, a) => s + a.distance, 0) / 1000;
}

function maxKm(runs: Activity[]): number {
  return runs.reduce((m, a) => Math.max(m, a.distance / 1000), 0);
}

function countAtLeastKm(runs: Activity[], minKm: number): number {
  return runs.filter(a => a.distance / 1000 >= minKm).length;
}

/** Km de la mejor semana de la ventana. */
function bestWeekKm(runs: Activity[]): number {
  const byWeek = new Map<number, number>();
  for (const a of runs) {
    const w = weekIndex(localDay(a));
    byWeek.set(w, (byWeek.get(w) ?? 0) + a.distance / 1000);
  }
  let best = 0;
  for (const v of byWeek.values()) if (v > best) best = v;
  return best;
}

/**
 * Semanas activas consecutivas terminando en la semana actual. Si esta semana
 * todavía no tiene salidas, se cuenta desde la anterior — no haber corrido el
 * lunes no rompe una racha de medio año.
 */
function activeWeekStreak(runs: Activity[], now: Date): number {
  const weeks = new Set(runs.map(a => weekIndex(localDay(a))));
  if (!weeks.size) return 0;
  const nowWeek = weekIndex(dateStringOf(now));
  let w = weeks.has(nowWeek) ? nowWeek : nowWeek - 1;
  let streak = 0;
  while (weeks.has(w)) {
    streak++;
    w--;
  }
  return streak;
}

/** El mejor ritmo de la ventana, mirando sólo salidas de 5 km o más. */
function bestPaceSec(runs: Activity[]): number {
  let best = 0;
  for (const a of runs) {
    if (a.distance < 5000) continue;
    const p = paceSecPerKm(a);
    if (p > 0 && (best === 0 || p < best)) best = p;
  }
  return best;
}

function countFasterThan(runs: Activity[], secPerKm: number): number {
  return runs.filter(a => {
    if (a.distance < 5000) return false;
    const p = paceSecPerKm(a);
    return p > 0 && p < secPerKm;
  }).length;
}

function totalElevation(runs: Activity[]): number {
  return runs.reduce((s, a) => s + (a.total_elevation_gain || 0), 0);
}

function countWithElevation(runs: Activity[], minMeters: number): number {
  return runs.filter(a => (a.total_elevation_gain || 0) >= minMeters).length;
}

// ── Resolución de nivel y porcentaje ────────────────────────────────────────

function req(
  label: string,
  value: number,
  from: number,
  target: number,
  display: string,
  targetDisplay: string,
): Requirement {
  return { label, value, from, target, display, targetDisplay, met: value >= target };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * El nivel es **secuencial**: hay que cumplir los tres requisitos del nivel 1
 * para que cuente el 2. Es un árbol, los nodos se desbloquean en orden — tener
 * una maratón sin haber sostenido diez salidas de 10K no te saltea el primer
 * nodo.
 *
 * El porcentaje avanza dentro del tramo por el requisito **más atrasado**: el
 * cuello de botella. Promediar dejaría esconder un requisito en cero detrás de
 * otro cumplido de sobra, y el radar diría que te falta poco cuando te falta
 * todo de una de las dos cosas.
 */
function resolve(tiers: Tier[]): { level: 0 | 1 | 2 | 3; pct: number } {
  let level: 0 | 1 | 2 | 3 = 0;
  for (const tier of tiers) {
    if (tier.requirements.every(r => r.met)) level = tier.level;
    else break;
  }

  for (const tier of tiers) tier.unlocked = tier.level <= level;

  if (level === 3) return { level, pct: 100 };

  const next = tiers[level];
  const progress = Math.min(
    ...next.requirements.map(r =>
      r.target > r.from ? clamp01((r.value - r.from) / (r.target - r.from)) : r.met ? 1 : 0,
    ),
  );

  const pct = ANCHORS[level] + progress * (ANCHORS[level + 1] - ANCHORS[level]);
  return { level, pct: Math.round(pct * 10) / 10 };
}

// ── Las seis ramas ──────────────────────────────────────────────────────────

function resistencia(runs: Activity[]): BranchSnapshot {
  const semanal = totalKm(runs) / SEMANAS_TRIMESTRE;
  const pico = bestWeekKm(runs);

  const A = [15, 35, 75];
  const B = [25, 55, 100];
  const nombres = ['Rodador', 'Fondista', 'Ultrafondista'];

  const tiers: Tier[] = [0, 1, 2].map(i => ({
    level: (i + 1) as 1 | 2 | 3,
    name: nombres[i],
    unlocked: false,
    requirements: [
      req('Volumen semanal', semanal, i === 0 ? 0 : A[i - 1], A[i],
        `${km(semanal)}/sem`, `${kmRound(A[i])}/sem`),
      req('Mejor semana', pico, i === 0 ? 0 : B[i - 1], B[i], km(pico), kmRound(B[i])),
    ],
  }));

  return {
    id: 'resistencia',
    name: 'Resistencia',
    tagline: 'Cuánto podés sostener',
    tiers,
    ...resolve(tiers),
  };
}

function fondo(runs: Activity[]): BranchSnapshot {
  const mayor = maxKm(runs);
  const distancias = [10, HALF_MARATHON_KM, MARATHON_KM];
  const cuantas = [10, 4, 1];
  const nombres = ['Diezmilero', 'Veintiunero', 'Maratonista'];

  const tiers: Tier[] = [0, 1, 2].map(i => {
    const cuenta = countAtLeastKm(runs, distancias[i]);
    return {
      level: (i + 1) as 1 | 2 | 3,
      name: nombres[i],
      unlocked: false,
      requirements: [
        req('Distancia máxima', mayor, i === 0 ? 0 : distancias[i - 1], distancias[i],
          km(mayor), km(distancias[i], distancias[i] % 1 === 0 ? 0 : 1)),
        req(`Salidas de ${km(distancias[i], distancias[i] % 1 === 0 ? 0 : 1)}+`,
          cuenta, 0, cuantas[i], salidas(cuenta), salidas(cuantas[i])),
      ],
    };
  });

  return {
    id: 'fondo',
    name: 'Fondo',
    tagline: 'Hasta dónde podés llegar',
    tiers,
    ...resolve(tiers),
  };
}

function velocidad(runs: Activity[]): BranchSnapshot {
  const mejor = bestPaceSec(runs);
  const puntos = pacePoints(mejor);
  const ritmos = [360, 315, 270];
  const cuantas = [15, 10, 5];
  const nombres = ['Ligero', 'Pasadista', 'Velocista'];

  const tiers: Tier[] = [0, 1, 2].map(i => {
    const cuenta = countFasterThan(runs, ritmos[i]);
    return {
      level: (i + 1) as 1 | 2 | 3,
      name: nombres[i],
      unlocked: false,
      requirements: [
        req('Mejor ritmo', puntos,
          i === 0 ? 0 : pacePoints(ritmos[i - 1]), pacePoints(ritmos[i]),
          paceLabel(mejor), paceLabel(ritmos[i])),
        req(`Salidas bajo ${paceLabel(ritmos[i])}`,
          cuenta, 0, cuantas[i], salidas(cuenta), salidas(cuantas[i])),
      ],
    };
  });

  return {
    id: 'velocidad',
    name: 'Velocidad',
    tagline: 'Qué tan rápido',
    tiers,
    ...resolve(tiers),
  };
}

function consistencia(runs: Activity[], now: Date): BranchSnapshot {
  const racha = activeWeekStreak(runs, now);
  const porSemana = runs.length / SEMANAS_ANIO;

  const A = [4, 12, 26];
  const B = [2, 3, 4];
  const nombres = ['Constante', 'Metódico', 'Inquebrantable'];

  const tiers: Tier[] = [0, 1, 2].map(i => ({
    level: (i + 1) as 1 | 2 | 3,
    name: nombres[i],
    unlocked: false,
    requirements: [
      req('Racha activa', racha, i === 0 ? 0 : A[i - 1], A[i],
        semanas(racha), semanas(A[i])),
      req('Salidas por semana', porSemana, i === 0 ? 0 : B[i - 1], B[i],
        porSemana.toFixed(1).replace('.', ','), String(B[i])),
    ],
  }));

  return {
    id: 'consistencia',
    name: 'Consistencia',
    tagline: 'Qué tan regularmente entrenás',
    tiers,
    ...resolve(tiers),
  };
}

function exploracion(runs: Activity[]): BranchSnapshot {
  const lugares = countDistinctStartingPlaces(runs, RADIO_ZONA_KM);
  const A = [5, 25, 100];
  const nombres = ['Explorador', 'Trotamundos', 'Conquistador'];

  const tiers: Tier[] = [0, 1, 2].map(i => ({
    level: (i + 1) as 1 | 2 | 3,
    name: nombres[i],
    unlocked: false,
    requirements: [
      req('Lugares distintos', lugares, i === 0 ? 0 : A[i - 1], A[i],
        `${lugares}`, `${A[i]}`),
    ],
  }));

  return {
    id: 'exploracion',
    name: 'Exploración',
    tagline: 'Cuánto territorio recorrés',
    tiers,
    ...resolve(tiers),
  };
}

/**
 * Los umbrales de desnivel están rotulados con montañas porque el número solo
 * no dice nada. Sólo tenemos ascenso acumulado (`total_elevation_gain`); el
 * descenso no viene en el payload y calcularlo pediría el stream de altímetro
 * de cada actividad, que es una llamada por salida.
 */
const EVEREST_M = 8849;
const ACONCAGUA_M = 6961;

function desnivel(runs: Activity[]): BranchSnapshot {
  const acumulado = totalElevation(runs);
  const conCuesta = countWithElevation(runs, 100);

  const A = [5000, EVEREST_M, ACONCAGUA_M * 2];
  const B = [5, 20, 50];
  const nombres = ['Trepador', 'Escalador', 'Cumbrero'];
  const rotulos = ['5.000 m', 'un Everest', 'dos Aconcaguas'];

  const tiers: Tier[] = [0, 1, 2].map(i => ({
    level: (i + 1) as 1 | 2 | 3,
    name: nombres[i],
    unlocked: false,
    requirements: [
      req('Ascenso acumulado', acumulado, i === 0 ? 0 : A[i - 1], A[i],
        metros(acumulado), `${metros(A[i])} · ${rotulos[i]}`),
      req('Salidas con +100 m', conCuesta, i === 0 ? 0 : B[i - 1], B[i],
        salidas(conCuesta), salidas(B[i])),
    ],
  }));

  return {
    id: 'desnivel',
    name: 'Desnivel',
    tagline: 'Qué tanto subís',
    tiers,
    ...resolve(tiers),
  };
}

// ── Export principal ────────────────────────────────────────────────────────

/**
 * El orden es el de los ejes del radar y el de las ramas del árbol, en sentido
 * horario desde arriba. Los dos leen de acá para que un eje y su rama caigan
 * siempre en el mismo ángulo.
 */
export const BRANCH_ORDER: BranchId[] = [
  'resistencia',
  'fondo',
  'velocidad',
  'consistencia',
  'exploracion',
  'desnivel',
];

export function computeBranchTree(activities: Activity[], now: Date = new Date()): TreeSnapshot {
  const runs = activities.filter(isRunning);
  const anio = within(runs, now, DIAS_ANIO);
  const trimestre = within(runs, now, DIAS_TRIMESTRE);

  const branches: BranchSnapshot[] = [
    resistencia(trimestre),
    fondo(anio),
    velocidad(anio),
    consistencia(anio, now),
    exploracion(anio),
    desnivel(anio),
  ];

  const maxLevel = branches.reduce<0 | 1 | 2 | 3>(
    (m, b) => (b.level > m ? b.level : m),
    0,
  );

  return { branches, maxLevel };
}

/**
 * El mismo árbol proyectado a 30 días sin correr. No agrega actividades: sólo
 * adelanta el reloj, y cada ventana se corre sola.
 */
export function computeBranchDecay(activities: Activity[], now: Date = new Date()): TreeSnapshot {
  const later = new Date(now);
  later.setDate(later.getDate() + DIAS_DECAIMIENTO);
  return computeBranchTree(activities, later);
}
