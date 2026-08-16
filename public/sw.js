/**
 * Service worker de Platenzen (frente D — "Platenzen se instala").
 *
 * Qué resuelve: que la app se pueda instalar y abrir standalone, con un
 * fallback razonable cuando no hay red. Base tomada de
 * `mixbol-front/public/sw.js` (network-first en navegaciones, SWR en
 * estáticos, `/api` nunca interceptada); la forma del comentario de cabecera y
 * el criterio de "no precachear los chunks de Next" vienen de
 * `valle-verde/public/sw.js`. Diferencias entre ambos antecedentes y cuál se
 * siguió en cada punto: ver `docs/feedback-frente-d.md`.
 *
 * Qué NO hace, por pedido explícito ("no convertir Platenzen en una app
 * offline-first artificialmente"):
 *   - No cachea datos de actividades. Ya están resueltos en otra capa
 *     (`src/lib/cache.ts`, localStorage con TTL de 6 días) y todo el cálculo
 *     corre en el cliente: si el shell está cacheado, el dashboard abre sin
 *     conexión con datos reales sin que este archivo haga nada extra.
 *   - No encola escrituras. No hay outbox, no hay Background Sync, no hay
 *     reintentos diferidos — tampoco hay escrituras que encolar: Platenzen no
 *     tiene mutaciones propias más allá del OAuth, que está excluido abajo.
 *
 * LA REGLA QUE MANDA SOBRE TODO LO DEMÁS DE ESTE ARCHIVO:
 * el service worker no toca `/api` jamás. Ahí viven el intercambio del código
 * OAuth de Strava por tokens (`/api/strava/callback`) y el refresco de
 * credenciales (`/api/strava/refresh`). Si una de esas respuestas se sirviera
 * alguna vez desde caché, el `Set-Cookie` que las renueva no llegaría y la
 * sesión quedaría pisada por un token viejo. Por eso es la primera guarda del
 * `fetch`, antes que cualquier otra cosa — y si en algún momento a alguien se
 * le ocurre "acelerar la app cacheando las respuestas de la API", que
 * encuentre este comentario antes de escribir el código.
 *
 * No hay precache de los chunks de Next a propósito: sus nombres llevan hash y
 * cambian en cada deploy de Vercel, así que una lista fija queda vieja al
 * primer push. Se cachea lo que se usa, a medida que se usa (stale-while-
 * revalidate más abajo).
 */

/**
 * Subir este número invalida todo lo cacheado (el `activate` borra las
 * `platenzen-*` que no sean la actual). Hace falta cuando cambia el contenido
 * de un archivo sin cambiar su nombre — por ejemplo, un ícono nuevo bajo el
 * mismo path, o un cambio en `offline.html`.
 */
const CACHE_NAME = 'platenzen-v1';

/**
 * Shell mínimo a precachear: la página de respaldo sin red y los assets fijos
 * que necesita (el manifiesto y el único ícono disponible hoy). Nada con hash
 * de build, y nada de `/` — ver más abajo por qué.
 */
const SHELL_URLS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/platenzen_logo.png',
];

/**
 * INSTALL: precachear el shell, URL por URL y tolerando fallas.
 *
 * `cache.addAll` es atómico: si una sola URL falla, no se instala nada y el
 * sitio queda sin service worker, reintentando en cada carga (lección pagada
 * por Mixbol). Cacheando de a una con `.catch(() => {})`, un asset que falte
 * no le cuesta el resto del shell a la instalación.
 *
 * No se precachea `/`: es la ruta del dashboard, y a diferencia de Mixbol acá
 * no hay middleware de sesión que la redirija a un login (ese caso rompía el
 * install entero en Mixbol). Tampoco hace falta: la primera visita con red la
 * cachea sola por network-first.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(SHELL_URLS.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

/**
 * ACTIVATE: borrar cachés de versiones viejas y tomar control de las pestañas
 * ya abiertas.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('platenzen-') && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. /api jamás se intercepta. Ver el comentario de cabecera: acá vive el
  // OAuth de Strava y una respuesta cacheada es un token viejo aplicado a una
  // sesión nueva.
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // 2. Lo que no es GET no se toca. Nada que el worker no vea puede diferirlo
  // ni cachearlo — y acá no hay cola para diferir nada de todos modos.
  if (request.method !== 'GET') {
    return;
  }

  // 3. Navegaciones: network-first, con la caché y después la página offline
  // como respaldo.
  //
  // Por qué network-first y no stale-while-revalidate, que es la decisión de
  // diseño de este archivo: con SWR el usuario ve siempre el resultado de la
  // carga anterior mientras se refresca por detrás. En Valle Verde eso se
  // probó contra datos y se revirtió. Acá el efecto sería más sutil y peor: el
  // dashboard mostraría los números de la sesión pasada como si fueran los de
  // ahora, y los números son la promesa de este producto (AGENTS.md, regla 1:
  // "un cálculo mal hecho no es un bug visual: le miente al corredor sobre su
  // progreso"). Un dashboard lento es un problema; uno que miente con
  // confianza, otro.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // El clone va ANTES de devolver la response: apenas se devuelve, el
          // navegador consume su body y `clone()` explota con "Response body
          // is already used".
          if (response && response.status === 200) {
            const copia = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copia)).catch(() => {});
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // 4. Assets estáticos con nombre versionado (chunks de Next) o binarios
  // pesados (imágenes/fuentes): stale-while-revalidate. Se sirve lo que haya
  // en caché al instante y se refresca en segundo plano; si no hay nada
  // cacheado, se va a la red y esa respuesta pasa a ser la primera copia.
  if (
    url.pathname.startsWith('/_next/static') ||
    /\.(png|jpg|jpeg|svg|gif|webp|woff|woff2)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                return caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
              }
            })
            .catch(() => {});
          return cached;
        }

        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const copia = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copia)).catch(() => {});
          }
          return response;
        });
      })
    );
    return;
  }

  // 5. Cualquier otra cosa: a la red, sin interceptar.
});
