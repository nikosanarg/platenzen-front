import { Activity } from '@/types/activity';

/**
 * Une actividades de uno o más proveedores en una sola lista sin duplicados.
 *
 * La clave de deduplicación es `provider:externalId`, nunca `id` solo: dos
 * proveedores pueden emitir el mismo número y `Activity.id` no garantiza
 * unicidad entre ellos (ver `src/types/activity.ts`).
 *
 * Ante clave repetida gana la última: así una resincronización con datos
 * corregidos actualiza en vez de ser ignorada, y correr una sincronización dos
 * veces es seguro (idempotente).
 *
 * Con un solo proveedor conectado esto es un no-op caro, y está bien: es la
 * pieza que hace que conectar el segundo no requiera tocar nada más.
 */
export function mergeActivities(...listas: Activity[][]): Activity[] {
  const porClave = new Map<string, Activity>();

  for (const lista of listas) {
    for (const actividad of lista) {
      const clave = `${actividad.provider}:${actividad.externalId}`;
      porClave.set(clave, actividad);
    }
  }

  return Array.from(porClave.values()).sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );
}
