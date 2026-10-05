/**
 * Corredores de ejemplo para el club: llenan el ranking y las fichas con datos
 * que se ven reales, repartidos en las tres ligas.
 *
 *   npx tsx --env-file=.env.local scripts/club-ejemplo.ts           # sembrar (o resembrar)
 *   npx tsx --env-file=.env.local scripts/club-ejemplo.ts --borrar  # quitarlos
 *
 * Habla directo con platenzen-api (`PLATENZEN_API_URL` + `PLATENZEN_SERVER_SECRET`),
 * como el servidor del front: pasa por la misma validación que un corredor real.
 * Las actividades son inventadas pero recorren el camino de siempre —payload de
 * Strava → adapter → stats → `construirPublicacion`—, así las fichas salen de los
 * mismos cálculos que las de verdad.
 *
 * Cada identidad es `sha256("platenzen-ejemplo:<clave>")`: fija, reproducible y
 * imposible de confundir con la de un atleta (esas son un HMAC con secreto).
 * Resembrar reemplaza a los mismos corredores; `--borrar` los da de baja a todos.
 */
import { createHash } from 'crypto';
import { toActivity } from '@/services/providers/strava/adapter';
import { StravaActivity } from '@/types/strava';
import { Activity } from '@/types/activity';
import { computeStats } from '@/lib/stats';
import { construirPublicacion } from '@/lib/club/publicacion';
import { ACUERDOS_VERSION } from '@/lib/club/acuerdos';
import { localDateKey } from '@/utils/localDate';

interface Persona {
  clave: string;
  usuario: string | null;
  nombre: string | null;
  pais: string | null;
  visibilidad: 'publica' | 'solo_ranking' | 'oculta';
  /** Semanas seguidas con actividad hasta la actual: decide la liga. */
  racha: number;
  /** Semanas de historia antes de la racha (con un hueco entre medio). */
  historia: number;
  salidasPorSemana: [number, number];
  km: [number, number];
  /** Segundos por km. */
  ritmo: [number, number];
  trail?: number;
  bici?: number;
}

const PERSONAS: Persona[] = [
  // Oro: 12 semanas seguidas o más.
  { clave: 'lucia', usuario: 'luchi.runs', nombre: 'Lucía Fernández', pais: 'AR', visibilidad: 'publica', racha: 20, historia: 30, salidasPorSemana: [3, 5], km: [8, 16], ritmo: [300, 330] },
  { clave: 'martin', usuario: 'martin_gomez', nombre: 'Martín Gómez', pais: 'AR', visibilidad: 'publica', racha: 15, historia: 40, salidasPorSemana: [4, 6], km: [6, 21.5], ritmo: [275, 305] },
  { clave: 'trail-uy', usuario: null, nombre: null, pais: 'UY', visibilidad: 'publica', racha: 13, historia: 20, salidasPorSemana: [2, 4], km: [10, 26], ritmo: [340, 410], trail: 0.5 },
  // Plata: de 4 a 11.
  { clave: 'sofia', usuario: 'sofi.ramirez', nombre: 'Sofía Ramírez', pais: 'CL', visibilidad: 'publica', racha: 9, historia: 25, salidasPorSemana: [2, 4], km: [5, 12], ritmo: [320, 360] },
  { clave: 'diego', usuario: null, nombre: 'Diego Paz', pais: 'AR', visibilidad: 'solo_ranking', racha: 6, historia: 30, salidasPorSemana: [3, 5], km: [8, 15], ritmo: [290, 320] },
  { clave: 'carla', usuario: 'carlamendez', nombre: 'Carla Méndez', pais: 'ES', visibilidad: 'publica', racha: 4, historia: 12, salidasPorSemana: [2, 3], km: [5, 10], ritmo: [360, 400], bici: 0.3 },
  { clave: 'tomas', usuario: 'tomas.ruiz', nombre: 'Tomás Ruiz', pais: 'MX', visibilidad: 'publica', racha: 7, historia: 35, salidasPorSemana: [2, 4], km: [10, 30], ritmo: [330, 370] },
  // Bronce: menos de 4.
  { clave: 'vale', usuario: 'vale.sosa', nombre: 'Valentina Sosa', pais: 'AR', visibilidad: 'publica', racha: 2, historia: 10, salidasPorSemana: [1, 3], km: [5, 8], ritmo: [380, 420] },
  { clave: 'volviendo', usuario: null, nombre: null, pais: null, visibilidad: 'publica', racha: 0, historia: 25, salidasPorSemana: [2, 4], km: [6, 12], ritmo: [340, 370] },
  { clave: 'jpablo', usuario: 'jpablo', nombre: 'Juan Pablo Ríos', pais: 'AR', visibilidad: 'publica', racha: 3, historia: 20, salidasPorSemana: [1, 1], km: [21, 32], ritmo: [300, 320] },
  { clave: 'ana', usuario: 'anatorres', nombre: 'Ana Torres', pais: 'UY', visibilidad: 'publica', racha: 1, historia: 8, salidasPorSemana: [2, 3], km: [3, 6], ritmo: [420, 480], bici: 0.5 },
  { clave: 'rami', usuario: 'rami', nombre: 'Ramiro Díaz', pais: 'AR', visibilidad: 'solo_ranking', racha: 0, historia: 15, salidasPorSemana: [2, 3], km: [5, 10], ritmo: [310, 340] },
  // Oculta: tiene racha de plata pero no aparece en ningún lado.
  { clave: 'pilar', usuario: 'pilar.o', nombre: 'Pilar Ortega', pais: 'AR', visibilidad: 'oculta', racha: 10, historia: 20, salidasPorSemana: [3, 4], km: [6, 12], ritmo: [330, 350] },
];

const NOMBRES_SALIDA = ['Carrera matutina', 'Fondo del domingo', 'Rodaje suave', 'Pasadas en pista', 'Vuelta al lago', 'Tempo', 'Regenerativo', 'Carrera por la tarde'];

/** PRNG con semilla: el mismo corredor sale igual cada vez que se siembra. */
function azar(semilla: string): () => number {
  let a = createHash('sha256').update(semilla).digest().readUInt32LE(0);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const entre = (r: () => number, [min, max]: [number, number]) => min + r() * (max - min);

/** Lunes de la semana actual, a medianoche local. */
function lunesActual(hoy: Date): Date {
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function actividades(p: Persona, hoy: Date): Activity[] {
  const r = azar(p.clave);
  const lunes = lunesActual(hoy);
  const salida: Activity[] = [];
  let n = 0;

  // Semana 0 es la actual; la racha ocupa las semanas 0..racha-1 (o 1..racha si hoy es lunes temprano).
  // Después de la racha va una semana vacía, y antes, historia con huecos.
  const totalSemanas = p.racha + 1 + p.historia;
  for (let s = 0; s < totalSemanas; s++) {
    const enRacha = s < p.racha;
    const hueco = s === p.racha;
    if (hueco || (!enRacha && r() < 0.35)) continue;

    const cantidad = Math.max(1, Math.round(entre(r, p.salidasPorSemana)));
    const dias = new Set<number>();
    while (dias.size < Math.min(cantidad, 7)) dias.add(Math.floor(r() * 7));

    for (const dia of dias) {
      const fecha = new Date(lunes);
      fecha.setDate(lunes.getDate() - 7 * s + dia);
      // En la semana actual no hay salidas futuras; si no quedó ninguna, va una hoy para sostener la racha.
      if (s === 0 && fecha > hoy) {
        if (salida.some(a => a.start_date_local.slice(0, 10) >= localDateKey(lunes))) continue;
        fecha.setTime(hoy.getTime());
      }

      const esBici = r() < (p.bici ?? 0);
      const esTrail = !esBici && r() < (p.trail ?? 0);
      const km = esBici ? entre(r, [20, 50]) : entre(r, p.km);
      const segPorKm = esBici ? entre(r, [110, 150]) : entre(r, p.ritmo) + (esTrail ? 40 : 0);
      const hora = 6 + Math.floor(r() * 13);
      const local = `${localDateKey(fecha)}T${String(hora).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}:00Z`;
      const tipo = esBici ? 'Ride' : esTrail ? 'TrailRun' : 'Run';

      const raw: StravaActivity = {
        id: 900000000 + n++,
        name: esBici ? 'Salida en bici' : NOMBRES_SALIDA[Math.floor(r() * NOMBRES_SALIDA.length)],
        type: esBici ? 'Ride' : 'Run',
        sport_type: tipo,
        distance: Math.round(km * 1000),
        moving_time: Math.round(km * segPorKm),
        elapsed_time: Math.round(km * segPorKm * 1.05),
        total_elevation_gain: Math.round(entre(r, esTrail ? [300, 1200] : [10, 120])),
        start_date: local,
        start_date_local: local,
        average_speed: 1000 / segPorKm,
        max_speed: (1000 / segPorKm) * 1.3,
        kudos_count: Math.floor(r() * 20),
        athlete_count: 1,
      };
      salida.push(toActivity(raw));
    }
  }
  return salida;
}

async function api(ruta: string, metodo: string, identidad: string, cuerpo?: unknown): Promise<Response> {
  const url = process.env.PLATENZEN_API_URL;
  const secreto = process.env.PLATENZEN_SERVER_SECRET;
  if (!url || !secreto) throw new Error('Faltan PLATENZEN_API_URL y PLATENZEN_SERVER_SECRET (usá --env-file=.env.local)');
  return fetch(`${url.replace(/\/$/, '')}${ruta}`, {
    method: metodo,
    headers: {
      'x-platenzen-secret': secreto,
      'x-corredor-identidad': identidad,
      ...(cuerpo !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });
}

const identidad = (clave: string) => createHash('sha256').update(`platenzen-ejemplo:${clave}`).digest('hex');

async function main() {
  const borrar = process.argv.includes('--borrar');
  const hoy = new Date();

  for (const p of PERSONAS) {
    const id = identidad(p.clave);
    // Siempre se arranca de cero: resembrar no deja restos de una corrida anterior.
    const baja = await api('/corredores/me', 'DELETE', id);
    if (borrar) {
      console.log(`${p.clave}: ${baja.status === 204 ? 'borrado' : 'no estaba'}`);
      continue;
    }

    const alta = await api('/corredores/me', 'POST', id, {
      usuario: p.usuario,
      nombreVisible: p.nombre,
      pais: p.pais,
      visibilidad: p.visibilidad,
      aceptaAcuerdos: ACUERDOS_VERSION,
    });
    if (!alta.ok) throw new Error(`${p.clave}: alta ${alta.status} ${await alta.text()}`);
    const perfil = (await alta.json()).data as { enlace: string; nombre: string };

    const acts = actividades(p, hoy);
    const publicacion = construirPublicacion(acts, computeStats(acts), hoy);
    const pub = await api('/corredores/me/publicacion', 'PUT', id, publicacion);
    if (!pub.ok) throw new Error(`${p.clave}: publicación ${pub.status} ${await pub.text()}`);

    console.log(
      `${p.clave.padEnd(10)} ${perfil.nombre.padEnd(18)} /hero/${perfil.enlace.padEnd(16)} ` +
        `liga=${publicacion.ficha.liga.padEnd(6)} racha=${publicacion.ficha.totales.rachaSemanas} ` +
        `km90=${publicacion.ficha.ultimos90.distanciaKm.toFixed(1)} ${p.visibilidad}`
    );
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
