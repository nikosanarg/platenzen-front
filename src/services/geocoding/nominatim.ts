/**
 * Nombre de un lugar a partir de su coordenada, vía la API pública de
 * Nominatim (OpenStreetMap) — el mismo proveedor que ya sirve los tiles del
 * mapa, así que no suma un tercero nuevo a la promesa de privacidad del
 * producto (ver `project-profile.md`, Arquitectura). Sale sólo la coordenada
 * central de un lugar, nunca un recorrido.
 *
 * Uso aceptable de Nominatim: como mucho una request por segundo, en una
 * cola secuencial — no por lugar en paralelo. `QUEUE_INTERVAL_MS` deja
 * margen sobre ese piso.
 */

const CACHE_KEY = 'platenzen_lugares_nombres';
const QUEUE_INTERVAL_MS = 1100;

interface NominatimAddress {
  neighbourhood?: string;
  suburb?: string;
  city_district?: string;
  town?: string;
  city?: string;
}

interface NominatimResponse {
  name?: string;
  address?: NominatimAddress;
}

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

function readCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeCacheEntry(key: string, name: string): void {
  try {
    const cache = readCache();
    cache[key] = name;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Cuota llena o storage bloqueado: el nombre no se recuerda, se vuelve a pedir después.
  }
}

function pickName(payload: NominatimResponse): string {
  const addr = payload.address ?? {};
  return payload.name || addr.neighbourhood || addr.suburb || addr.city_district || addr.town || addr.city || '';
}

// Cola secuencial: cada request espera a que termine la anterior, y además
// a que pase `QUEUE_INTERVAL_MS` desde la última — así muchos lugares
// pedidos juntos (al abrir el mapa) no salen todos en el mismo instante.
let cola: Promise<void> = Promise.resolve();
let ultimoPedido = 0;

// Un fallo (red caída, request bloqueada) no se reintenta en la misma
// sesión: evita machacar el servicio con el mismo lugar que ya falló.
const fallidosEnSesion = new Set<string>();

function encolar<T>(fn: () => Promise<T>): Promise<T> {
  const salida = cola.then(async () => {
    const espera = Math.max(0, QUEUE_INTERVAL_MS - (Date.now() - ultimoPedido));
    if (espera > 0) await new Promise(resolve => setTimeout(resolve, espera));
    ultimoPedido = Date.now();
    return fn();
  });
  // La cola sigue viva aunque esta request falle: si no, un solo error
  // trabaría a todos los lugares pedidos después.
  cola = salida.then(
    () => undefined,
    () => undefined
  );
  return salida;
}

/**
 * Nombre del lugar en esa coordenada, o `null` si no se pudo resolver
 * (todavía cargando, sin nombre disponible, o la request falló). El
 * llamador decide el fallback ("Lugar #n").
 */
export async function getPlaceName(lat: number, lon: number): Promise<string | null> {
  const key = cacheKey(lat, lon);

  const cached = readCache()[key];
  if (cached !== undefined) return cached || null;

  if (fallidosEnSesion.has(key)) return null;

  try {
    const name = await encolar(async () => {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=16&accept-language=es`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`nominatim ${res.status}`);
      const data = (await res.json()) as NominatimResponse;
      return pickName(data);
    });

    // Se cachea también el "sin nombre": ese lugar tampoco va a tener uno la
    // próxima vez, y así no se vuelve a pedir.
    writeCacheEntry(key, name);
    return name || null;
  } catch {
    fallidosEnSesion.add(key);
    return null;
  }
}
