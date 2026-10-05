import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Lo que el servidor de Platenzen sabe y el navegador no: los secretos con los
 * que habla con platenzen-api. Sólo lo importan las rutas de `src/app/api/club`.
 *
 * - `PLATENZEN_IDENTIDAD_SECRET` convierte el id de atleta de Strava en una
 *   identidad opaca (HMAC). La API nunca ve el id real. **No se rota**: si
 *   cambia, cada corredor pasa a ser otro y pierde su perfil.
 * - `CLUB_SESION_SECRET` firma la cookie que evita preguntarle a Strava quién
 *   es el usuario en cada pedido. Rotarlo sólo obliga a validar de nuevo.
 * - `PLATENZEN_SERVER_SECRET` es el que la API exige para creer la identidad.
 */

export const COOKIE_CLUB = 'pz_club';
export const PATH_COOKIE_CLUB = '/api/club';
export const DURACION_SESION_SEG = 60 * 60 * 24 * 30;

export interface ConfigClub {
  apiUrl: string;
  serverSecret: string;
  identidadSecret: string;
  sesionSecret: string;
}

/** `null` si falta algo: el club no está disponible y las rutas responden 503. */
export function configClub(): ConfigClub | null {
  const apiUrl = process.env.PLATENZEN_API_URL;
  const serverSecret = process.env.PLATENZEN_SERVER_SECRET;
  const identidadSecret = process.env.PLATENZEN_IDENTIDAD_SECRET;
  const sesionSecret = process.env.CLUB_SESION_SECRET;
  if (!apiUrl || !serverSecret || !identidadSecret || !sesionSecret) return null;
  return { apiUrl: apiUrl.replace(/\/$/, ''), serverSecret, identidadSecret, sesionSecret };
}

/** HMAC-SHA256 en hex de `strava:<id>`. El prefijo deja lugar a otros proveedores sin chocar. */
export function identidadDeAtleta(atletaId: string, secreto: string): string {
  return createHmac('sha256', secreto).update(`strava:${atletaId}`).digest('hex');
}

function firma(contenido: string, secreto: string): string {
  return createHmac('sha256', secreto).update(contenido).digest('base64url');
}

/** `<identidad>.<expira en epoch seg>.<firma>`. */
export function firmarSesion(identidad: string, secreto: string, ahoraSeg = Math.floor(Date.now() / 1000)): string {
  const contenido = `${identidad}.${ahoraSeg + DURACION_SESION_SEG}`;
  return `${contenido}.${firma(contenido, secreto)}`;
}

/** La identidad de una cookie válida y vigente; `null` en cualquier otro caso. */
export function leerSesion(
  valor: string | undefined,
  secreto: string,
  ahoraSeg = Math.floor(Date.now() / 1000)
): string | null {
  if (!valor) return null;
  const partes = valor.split('.');
  if (partes.length !== 3) return null;
  const [identidad, expira, recibida] = partes;
  if (!/^[0-9a-f]{64}$/.test(identidad) || !/^\d+$/.test(expira)) return null;

  const esperada = Buffer.from(firma(`${identidad}.${expira}`, secreto));
  const dada = Buffer.from(recibida);
  if (esperada.length !== dada.length || !timingSafeEqual(esperada, dada)) return null;
  if (Number(expira) < ahoraSeg) return null;
  return identidad;
}

/** Un pedido a platenzen-api con el secreto y, si hay, la identidad. */
export function llamarApi(
  config: ConfigClub,
  ruta: string,
  init: { method: string; body?: string; identidad?: string | null }
): Promise<Response> {
  const headers: Record<string, string> = { 'x-platenzen-secret': config.serverSecret };
  if (init.body !== undefined) headers['content-type'] = 'application/json';
  if (init.identidad) headers['x-corredor-identidad'] = init.identidad;
  return fetch(`${config.apiUrl}${ruta}`, { method: init.method, headers, body: init.body, cache: 'no-store' });
}
