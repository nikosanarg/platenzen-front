import { HeroProfile } from '@/lib/heroProfile';
import { Liga, RankingEntry, RankingSortKey } from '@/lib/ranking';
import { ACUERDOS_VERSION } from './acuerdos';
import { Publicacion } from './publicacion';

/**
 * El club visto desde el navegador: todo pasa por `/api/club/*` del propio
 * Platenzen, nunca directo a la API. El navegador no tiene ningún secreto; lo
 * único que aporta es el access token de Strava para abrir la sesión, una vez.
 */

export type Visibilidad = 'publica' | 'solo_ranking' | 'oculta';

export interface PerfilEditable {
  nombreVisible: string | null;
  pais: string | null;
  visibilidad: Visibilidad;
}

export interface MiPerfil extends PerfilEditable {
  id: string;
  alias: string;
  /** Lo que ven los demás: el nombre elegido o el alias. */
  nombre: string;
  acuerdosVersion: string;
  acuerdosVigentes: string;
  publicadaAt: string | null;
}

export interface RankingClub {
  ventanaDias: number;
  calculadoEl: string;
  ligas: Record<Liga, RankingEntry[]>;
}

export interface FichaPublica {
  id: string;
  nombre: string;
  pais: string | null;
  publicadaAt: string;
  ficha: HeroProfile;
}

/**
 * Un fallo con el código que manda la API (`NOMBRE_EN_USO`, …) o el proxy
 * (`CLUB_NO_DISPONIBLE`, `SIN_SESION`). La pantalla decide qué decir con él.
 */
export class ErrorClub extends Error {
  constructor(public code: string, public status: number, message?: string) {
    super(message ?? code);
    this.name = 'ErrorClub';
  }
}

type ObtenerToken = () => Promise<string | null>;

interface Sobre<T> {
  data?: T;
  message?: string;
  error?: string;
}

async function leer<T>(res: Response): Promise<Sobre<T>> {
  try {
    return (await res.json()) as Sobre<T>;
  } catch {
    return {};
  }
}

export async function abrirSesion(obtenerToken: ObtenerToken): Promise<void> {
  const token = await obtenerToken();
  const res = await fetch('/api/club/sesion', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const sobre = await leer<never>(res);
    throw new ErrorClub(sobre.error ?? 'CLUB_NO_DISPONIBLE', res.status);
  }
}

/**
 * Un pedido al proxy. Si la sesión del club no existe o venció, la abre con
 * el token de Strava y reintenta una sola vez.
 */
async function pedir<T>(
  ruta: string,
  init: { method?: string; body?: unknown } = {},
  obtenerToken?: ObtenerToken
): Promise<{ status: number; data: T | undefined }> {
  const hacer = () =>
    fetch(`/api/club/${ruta}`, {
      method: init.method ?? 'GET',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });

  let res = await hacer();
  if (res.status === 401 && obtenerToken) {
    await abrirSesion(obtenerToken);
    res = await hacer();
  }
  if (res.status === 204) return { status: 204, data: undefined };

  const sobre = await leer<T>(res);
  if (!res.ok) throw new ErrorClub(sobre.error ?? 'ERROR_INTERNO', res.status, sobre.message);
  return { status: res.status, data: sobre.data };
}

/** `null` si todavía no se sumó al club: la pantalla ofrece el alta. */
export async function miPerfil(obtenerToken: ObtenerToken): Promise<MiPerfil | null> {
  try {
    return (await pedir<MiPerfil>('corredores/me', {}, obtenerToken)).data ?? null;
  } catch (e) {
    if (e instanceof ErrorClub && e.code === 'NO_REGISTRADO') return null;
    throw e;
  }
}

export async function registrarse(perfil: PerfilEditable, obtenerToken: ObtenerToken): Promise<MiPerfil> {
  const { data } = await pedir<MiPerfil>(
    'corredores/me',
    { method: 'POST', body: { ...perfil, aceptaAcuerdos: ACUERDOS_VERSION } },
    obtenerToken
  );
  return data as MiPerfil;
}

export async function actualizarPerfil(perfil: PerfilEditable, obtenerToken: ObtenerToken): Promise<MiPerfil> {
  const { data } = await pedir<MiPerfil>('corredores/me', { method: 'PATCH', body: perfil }, obtenerToken);
  return data as MiPerfil;
}

export async function aceptarAcuerdos(obtenerToken: ObtenerToken): Promise<MiPerfil> {
  const { data } = await pedir<MiPerfil>(
    'corredores/me/acuerdos',
    { method: 'POST', body: { aceptaAcuerdos: ACUERDOS_VERSION } },
    obtenerToken
  );
  return data as MiPerfil;
}

export async function borrarCuenta(obtenerToken: ObtenerToken): Promise<void> {
  await pedir('corredores/me', { method: 'DELETE' }, obtenerToken);
}

export async function publicar(publicacion: Publicacion, obtenerToken: ObtenerToken): Promise<void> {
  await pedir('corredores/me/publicacion', { method: 'PUT', body: publicacion }, obtenerToken);
}

/** Público: no abre sesión. Si ya hay una, la API marca la fila propia. */
export async function obtenerRanking(orden: RankingSortKey): Promise<RankingClub> {
  const { data } = await pedir<RankingClub>(`ranking?orden=${orden}`);
  return data as RankingClub;
}

/** `null` si no existe o no muestra su ficha. */
export async function obtenerFicha(id: string): Promise<FichaPublica | null> {
  try {
    return (await pedir<FichaPublica>(`corredores/${encodeURIComponent(id)}`)).data ?? null;
  } catch (e) {
    if (e instanceof ErrorClub && e.status === 404) return null;
    throw e;
  }
}
