import { Activity } from '@/types/activity';
import { DayStats, ProcessedStats } from '@/types/stats';
import { BranchId, TreeSnapshot, computeBranchTree, ramaDominante, tituloDeRama } from '@/lib/branchTree';
import { CoreRecord, computeCoreRecord } from '@/lib/coreRecord';
import { sortActivities } from '@/lib/activityHistory';
import { isRunning } from '@/lib/sports';
import {
  Liga,
  RankingEntry,
  ResumenVentana,
  actividadesEnVentana,
  enVentana,
  ligaPorRacha,
  resumenRunning,
} from '@/lib/ranking';
import { computeLongestWeeklyStreak, computeWeeklyStreak } from '@/utils/streaks';
import { generateSmartInsights } from '@/utils/insights';
import { metersToKm } from '@/utils/units';
import { mpsToSecPerKm } from '@/utils/pace';

/**
 * La ficha pública de un corredor: lo que ve un tercero, ya calculado.
 *
 * Es datos planos a propósito — sin `Activity`, sin trazas GPS, sin fechas
 * con hora —, porque es la forma que va a guardar y servir la API del ranking
 * (`docs/plan-api-ranking.md`): el front la arma con las mismas
 * transformaciones que usa para las vistas privadas y publica esto, no el
 * historial crudo de Strava.
 */
export interface HeroProfile {
  /** `null` cuando no se conoce: la ficha propia, armada con los datos locales. */
  nombre: string | null;
  titulo: string;
  ramaId: BranchId;
  rama: string;
  liga: Liga;
  tree: TreeSnapshot;
  mejorMarca: CoreRecord | null;
  totales: {
    distanciaKm: number;
    actividades: number;
    rachaSemanas: number;
    rachaMasLargaSemanas: number;
  };
  ultimos90: ResumenVentana;
  destacadas: Record<DestacadaKey, HeroActividad[]>;
  /** Los días con actividad dentro de la ventana, para el mapa de calor trimestral. */
  dias90: DayStats[];
  frases: string[];
}

/** Sin id de proveedor a propósito: el id de Strava de una salida no es algo que un tercero necesite. */
export interface HeroActividad {
  /** `YYYY-MM-DD`, día local. */
  fecha: string;
  nombre: string;
  distanciaKm: number;
  /** Sólo running: el ritmo de una bici no se lee en min/km. */
  ritmoSegKm: number | null;
}

export type DestacadaKey = 'recientes' | 'largas' | 'rapidas';

export const DESTACADAS: readonly { id: DestacadaKey; label: string }[] = [
  { id: 'recientes', label: 'Más recientes' },
  { id: 'largas', label: 'Más largas' },
  { id: 'rapidas', label: 'Más rápidas' },
];

const TOP_DESTACADAS = 3;

function aHeroActividad(a: Activity): HeroActividad {
  return {
    fecha: a.start_date_local.slice(0, 10),
    nombre: a.name,
    distanciaKm: metersToKm(a.distance),
    ritmoSegKm: isRunning(a) && a.average_speed > 0 ? mpsToSecPerKm(a.average_speed) : null,
  };
}

/**
 * Las tres listas cortas de la ficha, con los mismos órdenes que el historial
 * privado (`sortActivities`). "Más rápidas" mira sólo running: ordenado por
 * velocidad sobre todos los deportes, el podio de un corredor serían sus
 * salidas en bici.
 */
function destacadas(activities: Activity[]): Record<DestacadaKey, HeroActividad[]> {
  const top = (lista: Activity[]) => lista.slice(0, TOP_DESTACADAS).map(aHeroActividad);
  const conRitmo = activities.filter(a => isRunning(a) && a.average_speed > 0);
  return {
    recientes: top(sortActivities(activities, 'fecha')),
    largas: top(sortActivities(activities, 'distancia')),
    rapidas: top(sortActivities(conRitmo, 'ritmo')),
  };
}

export function buildHeroProfile(
  activities: Activity[],
  stats: ProcessedStats,
  now: Date = new Date(),
  nombre: string | null = null
): HeroProfile {
  const tree = computeBranchTree(activities, now);
  const dominante = ramaDominante(tree);
  const rachaSemanas = computeWeeklyStreak(stats.daily, now);

  return {
    nombre,
    titulo: tituloDeRama(dominante),
    ramaId: dominante.id,
    rama: dominante.name,
    liga: ligaPorRacha(rachaSemanas),
    tree,
    mejorMarca: computeCoreRecord(activities),
    totales: {
      distanciaKm: stats.totalDistance,
      actividades: stats.totalActivities,
      rachaSemanas,
      rachaMasLargaSemanas: computeLongestWeeklyStreak(stats.daily),
    },
    ultimos90: resumenRunning(actividadesEnVentana(activities, now)),
    destacadas: destacadas(activities),
    dias90: stats.daily.filter(d => enVentana(d.date, now)),
    frases: generateSmartInsights(activities, stats, 'tercero').map(i => i.text),
  };
}

/** La fila de ranking de una ficha: los mismos números, sin recalcular nada. */
export function rankingEntryDe(id: string, profile: HeroProfile): RankingEntry {
  return {
    id,
    nombre: profile.nombre,
    rachaSemanas: profile.totales.rachaSemanas,
    liga: profile.liga,
    ...profile.ultimos90,
  };
}
