# Feedback — Frente D (PWA)

Escrito a medida que avanza la implementación, no al final (pedido explícito del plan).

## Estado

Completo. `npx tsc --noEmit`, `npm run lint`, `npx jest` y `npm run build` corren limpios
(salidas reales al final de este documento).

## Corrección sobre `project-profile.md`

El documento dice "Tests: no hay framework de testing configurado" y la tabla de comandos
dice "no hay suite configurada". Es incorrecto a esta fecha: el repo tiene Jest configurado
(`package.json` → `"test": "jest"`, `"test:coverage": "jest --coverage"`, devDependencies
`jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom`,
`@testing-library/user-event`) y `npx jest` corre **31 suites, 556 tests**, todos verdes —
lo confirmé antes de tocar nada, como baseline, y de nuevo al cerrar (mismo resultado). No
corrijo `project-profile.md` yo mismo porque no es territorio mío para esta tarea, pero
queda anotado para quien integre los cuatro frentes.

## Qué se construyó

- `src/app/manifest.ts` — ruta de metadata, `dynamic = 'force-static'`, sirve
  `/manifest.webmanifest`.
- `public/sw.js` — service worker escrito a mano, sin dependencias.
- `public/offline.html` — página de respaldo sin conexión.
- `src/components/pwa/RegistroServiceWorker.tsx` + `src/components/pwa/styled.ts` —
  componente cliente que registra el SW y maneja instalar/iOS/actualización.
- `src/app/layout.tsx` — `metadata` ampliada, export `viewport` nuevo, se monta
  `<RegistroServiceWorker />` en `<body>` después de `StyledComponentsRegistry`. No se tocó
  el orden de providers ni `StyledComponentsRegistry` en sí.

## Página offline: elegí `public/offline.html`

Por el mismo motivo que la usa Valle Verde: es la única página que tiene que funcionar
cuando no funciona nada más, así que no puede depender de nada que también haya que
cachear. La alternativa (`src/app/offline/page.tsx`) hubiera compartido el diseño real de
la app, pero arrastra los chunks de Next con hash — que es exactamente lo que este service
worker decide no precachear (los nombres cambian en cada deploy de Vercel). Los colores del
archivo están copiados a mano de `globals.css` (`--bg-primary` `#0d0d0f`, `--bg-card`
`#1a1a1f`, `--text-primary` `#f0f0f5`, `--text-secondary` `#9090a8`, `--accent` `#fc4c02`) en
un único `<style>` inline. A diferencia de Valle Verde no lleva variante de tema claro:
Platenzen es una app oscura sin modo claro, así que un solo juego de colores alcanza (no
hay `@media (prefers-color-scheme: dark)` en el archivo, a propósito).

## Diferencias entre las dos referencias, y qué tomé de cada una

El pedido original marca esto como entregable explícito ("identificar diferencias" y "tomar
el patrón que haya demostrado ser más estable"). Fui punto por punto:

| Punto | Mixbol (`mixbol-front/public/sw.js`) | Valle Verde (`valle-verde/public/sw.js`) | Qué tomé y por qué |
|---|---|---|---|
| Alcance de datos | No cachea `/api` (dashboard no depende de eso: Mixbol sí tiene backend propio de partidos pero no lo cachea) | Cachea `/api/*` con estrategia "red primero, caché de respaldo", con marca de antigüedad (`x-vv-guardado-en`) y poda por cuota | **Ninguna de las dos**: Platenzen no cachea nada de `/api` — ni siquiera con la estrategia de respaldo de Valle Verde. El motivo es más fuerte que en cualquiera de las dos referencias: `/api/strava/callback` y `/api/strava/refresh` manejan el intercambio y refresco de credenciales OAuth, y sólo Platenzen tiene ese caso en juego. La guarda es el primer `if` de `fetch`, con el comentario más largo del archivo explicando por qué. |
| Datos de la app | N/A (Mixbol no dijo nada sobre esto explícitamente) | Cachea explícitamente porque el árbol de Ubicación lo necesita para trabajar offline | **Ninguna**: el plan es explícito en que Platenzen ya resuelve el offline de datos en otra capa (`localStorage`, `src/lib/cache.ts`). El SW no necesita estrategia de datos, sólo de shell/assets. |
| Navegaciones | Network-first con fallback a caché y después a `/offline` | "Red primero, caché de respaldo" también para navegaciones (misma estrategia que datos) | **Mixbol**, casi textual: `fetch(request).catch(() => caches.match(request).then(c => c || caches.match('/offline.html')))`. Le agregué el `.then()` de éxito para guardar la respuesta en caché de camino (Mixbol no lo hace explícitamente en el bloque de navegación — su SWR de assets sí lo hace — así que sumé ese guardado para que la primera visita realmente quede disponible offline después, sin lo cual `/offline.html` sería el único respaldo posible incluso para rutas ya visitadas). |
| Por qué network-first y no SWR en navegaciones | No lo explica en comentarios | Sí, extensamente: SWR muestra el resultado de la carga anterior, que en un panel de trazabilidad es peor que la lentitud que ahorra | Copié el razonamiento de Valle Verde casi literal, pero adaptado a la regla propia de este repo (AGENTS.md regla 1: "un cálculo mal hecho no es un bug visual: le miente al corredor"). Es el mismo problema de fondo (mostrar un estado viejo con apariencia de fresco) aplicado a un dominio distinto. |
| Precache atómico | Resuelto explícitamente: `cache.add(url).catch(() => {})` por URL, con un comentario largo sobre por qué `addAll` rompía el install en `/` y `/inicio` (rutas protegidas por middleware que redirigían a `/login`) | No documenta el problema tan explícitamente, pero también cachea de a una | **Mixbol**, incluyendo el patrón `.catch(() => {})` por URL. El caso concreto que le pasó a Mixbol (ruta protegida por middleware redirigiendo, `addAll` fallando entero) no aplica a Platenzen — no hay middleware de sesión, `/` es pública siempre — pero dejé el mismo patrón defensivo porque el riesgo genérico (una URL cualquiera del shell 404 rompe todo el precache) es el mismo. |
| No precachear `/` | Mixbol lo aprendió "a los golpes" (documentado como aviso) | No aplica igual: Valle Verde no cachea la home del sitio público, sólo `/admin` | Seguí el aviso de Mixbol de no precachear `/`, aunque el motivo original (middleware redirigiendo) no existe acá — la razón que sí aplica es la que da el propio plan: no gana nada, la primera visita la cachea sola por network-first. |
| Forma del manifest | No usa `app/manifest.ts`: sirve `public/manifest.webmanifest` a mano | `app/manifest.ts` con `dynamic = 'force-static'`, ruta idiomática de App Router | **Valle Verde**. Es explícito en el plan y además es la forma correcta para Next 16 App Router (confirmado contra `node_modules/next/dist/docs/.../file-conventions/01-metadata/manifest.md`, que documenta exactamente ese patrón). |
| No precachear chunks de Next | Ninguna de las dos cachea chunks por nombre fijo (los dos usan SWR sobre `_next/static` sin lista) | Lo dice explícito como principio de diseño en el comentario de cabecera | Tomé el principio explícito de Valle Verde y lo dejé documentado igual de explícito en la cabecera de `public/sw.js`, aunque en la práctica el código (SWR sobre `_next/static/*` sin lista fija) es idéntico al de Mixbol. |
| Registro / ciclo de vida (`RegistroServiceWorker`) | Única referencia con este componente (Valle Verde no tiene equivalente, su registro está en otro lado del panel) | N/A | Mixbol es la única base real acá. Ver la sección siguiente para qué se tomó y qué no. |
| Página offline | HTML de Next (`/offline`, ruta de la app, no `public/`) | `public/offline.html`, HTML plano | **Valle Verde**, con la razón que ya di arriba (no depender de chunks con hash). |

**Cuál demostró ser más estable, en conjunto**: para la estrategia de red (`/api` afuera,
navegaciones network-first, assets SWR, precache tolerante a fallas) el patrón más probado
es el de **Mixbol** — es código que ya corre así en producción, sin outbox ni casos raros.
Para la **forma** de los archivos que Mixbol no tiene (el manifest como ruta de App Router,
la independencia de la página offline respecto del bundle de la app) gana **Valle Verde**,
que además es el patrón más nuevo de los dos (v1.2.26 vs. el v3 de Mixbol, sin fecha
explícita pero con menos comentarios de "esto se aprendió a los golpes" — Mixbol es el que
tiene más cicatrices documentadas, lo cual paradójicamente lo hace más confiable en la parte
de estrategia de caché: ya pisó los palitos que Platenzen podría pisar).

## Del componente de registro: qué se tomó de Mixbol y qué no

Tomado casi textual: el flujo `updatefound` → `statechange` → detectar
`newWorker.state === 'installed' && navigator.serviceWorker.controller` para distinguir
"primera instalación" de "actualización disponible"; la captura de `beforeinstallprompt`
con `preventDefault()` y guardado en un ref; la detección de iOS/Safari sin standalone; y
`navigator.storage.persist()`.

No tomado, con motivo (todos indicados también en el plan, confirmados al escribir):

- El banner de actualización de Mixbol se arma con `document.createElement` +
  `banner.innerHTML = ...` dentro del propio `useEffect`. Es deuda de aquel repo, no un
  patrón a replicar: acá el banner de actualización (`UpdateBanner` en
  `src/components/pwa/styled.ts`) es JSX condicionado por `useState`, con
  `styled-components` como el resto del repo.
- `console.log('SW registered:', registration)`: no se copió. Se mantuvo
  `console.error` en el `.catch()` del registro (fallo real, útil para debug), que el plan
  no pidió sacar — sólo pidió sacar el log de éxito, que es ruido.
- `useToast`: Platenzen no tiene ese contexto. El aviso de actualización se resuelve
  enteramente con el banner propio, sin depender de un sistema de notificaciones que no
  existe acá.

## Desvíos del plan, explicados

1. **Lint: `react-hooks/set-state-in-effect`.** El plan no lo menciona porque es un detalle
   de esta versión específica de `eslint-plugin-react-hooks` (v7.1.1, viene con
   `eslint-config-next@16.2.6`) que no estaba en ningún antecedente. La llamada a
   `setMostrarBannerIOS(true)` dentro del `useEffect` de detección de iOS disparaba un
   **error** de lint (no warning): "Avoid calling setState() directly within an effect".
   Encontré el patrón que ya usa este mismo repo para el mismo problema en
   `src/components/Dashboard/index.tsx:66` (`setIsMounted(true)` con
   `// eslint-disable-next-line react-hooks/set-state-in-effect` y un comentario explicando
   que es intencional porque depende de algo que sólo existe post-mount) y apliqué el mismo
   patrón, con comentario propio. No es un desvío de sustancia — el código hace exactamente
   lo que pedía el plan — pero anoto la fricción porque no iba a aparecer buscando en los
   dos antecedentes de otros repos, sólo mirando el propio código de Platenzen.
2. **`public/sw.js` heredó un `/* eslint-disable no-restricted-globals */` de la cabecera de
   Valle Verde** que acá no hacía falta (ese repo sí dispara esa regla sobre `self`/`caches`
   en `.js` de `public/`, éste no) y quedó como "unused eslint-disable directive" (warning).
   Se sacó.
3. **La estrategia de navegación de Mixbol no persiste la respuesta exitosa en caché** (sólo
   lo hace en el bloque SWR de assets). La copié pero le agregué el guardado de la respuesta
   exitosa (`response.clone()` + `cache.put`) en el camino feliz de `fetch(request)`, porque
   si no lo hiciera, ninguna navegación quedaría disponible offline salvo `/offline.html`
   mismo — el fallback sería siempre la página genérica, nunca "lo último que viste", que es
   justo el comportamiento que el plan describe como deseable para la experiencia offline
   ("Platenzen ya guarda el historial... si el shell de la app está cacheado, el dashboard
   abre sin conexión"). Sin este agregado el shell no quedaría cacheado nunca.

## Deuda preexistente vista al pasar (no se tocó)

- `src/components/CoachPersonalizado/index.tsx:21` — `CoachImage` importado y sin usar
  (warning de lint preexistente).
- `src/components/Dashboard/index.tsx:68,143` — dos `useEffect` con dependencia faltante
  (`setIsMounted`, `setIsMobile`), warnings preexistentes de `react-hooks/exhaustive-deps`.
  Son falsos positivos típicos (setters de `useState` son estables), no bugs reales.
- `src/lib/achievements.ts:151` — parámetro `stats` sin usar.
- `src/lib/roles.ts:226` — `explorador_min_places` asignado y sin usar.

Ninguno es mío ni lo toqué. El plan de este frente contó "6 warnings preexistentes" como
piso heredado; al cerrar cuento 5 en el mismo lint (ver salida real más abajo) — la
diferencia no viene de un cambio mío (no toqué ninguno de esos cuatro archivos), así que
asumo que el número del plan era aproximado o de un estado ligeramente distinto del branch
base. Los cuatro archivos de arriba son los que efectivamente aparecen.

## Pendiente para revisión humana: íconos 192/512 maskable

**No generado por código, a propósito** (pedido explícito del plan). El único ícono
cuadrado disponible hoy es `public/assets/platenzen_logo.png` (412×411, confirmado con
`System.Drawing` antes de usarlo), declarado en el manifest con `purpose: 'any'`. Alcanza
para que Chrome considere la app instalable (pide 192px o más) pero:

- Falta un juego 192×192 y 512×512 con variante `purpose: 'maskable'` (el logo con margen
  de seguridad para la máscara circular de Android — sin esto, Android recorta el logo
  actual de forma imprevisible).
- Idealmente también un `apple-touch-icon` dedicado (Apple no soporta `maskable` pero sí
  quiere su propio tamaño, típicamente 180×180, sin transparencia).

Es la misma deuda que tiene Valle Verde con `logo2.png` (410×410) hoy, documentada en su
`app/manifest.ts`. Necesita a alguien mirando el logo y decidiendo el margen de seguridad
para la máscara, no un resize automático.

## Inventario de qué merece test

No se escribieron tests (pedido explícito del plan: la cobertura se hace una vez, integrada,
al cerrar los cuatro frentes). Lo que quedaría por cubrir de este frente:

1. **`RegistroServiceWorker`: registro sólo en producción y contexto seguro.** Mockear
   `process.env.NODE_ENV` y `window.isSecureContext` en las cuatro combinaciones; verificar
   que `navigator.serviceWorker.register` sólo se llama cuando ambas condiciones se cumplen.
2. **La guarda de `/api` en `public/sw.js`.** No es JS de la app (corre en el worker), así
   que necesita un test de service worker de verdad (`jest-environment-node` con mocks de
   `self`/`caches`/`fetch`, o una librería tipo `service-worker-mock`) o, más realista para
   este stack, un test de integración con Playwright que intercepte la petición y confirme
   que nunca pasa por `caches.match`/`cache.put`. Es el punto de mayor valor de cobertura de
   todo este frente: es la regla de seguridad que protege el OAuth.
3. **El fallback offline** (`caches.match(request) || caches.match('/offline.html')` en el
   bloque de navegación): mismo comentario, necesita entorno de service worker o un test
   E2E real desconectando la red (Playwright con `context.setOffline(true)`).
4. **El flujo de actualización**: simular `updatefound` → `installing` →
   `statechange('installed')` con y sin `navigator.serviceWorker.controller` presente, y
   verificar que el banner sólo aparece en el segundo caso. Esto sí es testeable con
   Testing Library mockeando `navigator.serviceWorker` como objeto falso — no necesita
   entorno real de SW, es lógica de React.
5. **Detección de iOS/Safari**: mockear `navigator.userAgent` y `window.navigator.standalone`
   en las combinaciones (iOS+Safari, iOS+Chrome, Android, desktop) y verificar que el banner
   sólo se muestra en el primer caso. Testeable con Testing Library, sin entorno especial.
6. **`beforeinstallprompt` → botón → `prompt()` → `userChoice`**: simular el evento, click,
   y las dos resoluciones (`accepted`/`dismissed`), verificando que el botón desaparece sólo
   en el primer caso. Testeable con Testing Library.
7. **`src/app/manifest.ts`**: test de contenido simple (no de render) verificando los campos
   fijos — `scope: '/'`, `display: 'standalone'`, colores, ícono — para que un cambio
   accidental de alguno de esos valores (por ejemplo, alguien reintroduciendo `--accent`
   como `theme_color`) se note en CI en vez de en producción.

Los puntos 2 y 3 son los únicos que genuinamente necesitan algo más pesado que Testing
Library (entorno de Service Worker o E2E); los puntos 1, 4, 5, 6 y 7 son testeables hoy
mismo con lo que el repo ya tiene instalado.

## Verificación manual pendiente (no pude correrla)

Todo lo siguiente necesita un navegador real y, en varios casos, credenciales de Strava.
Pasos concretos para quien lo pruebe:

1. **Instalar la app (desktop, Chrome/Edge).**
   - `npm run build && npm run start` (el SW sólo se registra en producción).
   - Abrir `http://localhost:3000` (o el dominio real) con DevTools → Application →
     Manifest: confirmar que carga sin errores, íconos visibles, y que Chrome muestra el
     ícono de instalar en la barra de direcciones.
   - Instalar, abrir la app instalada, confirmar que abre standalone (sin barra de
     navegación del browser) y que el `theme_color`/`background_color` oscuro se aplica
     desde el primer frame (sin fogonazo blanco).
2. **Instalar en Android (Chrome).**
   - Mismo build en un dominio con HTTPS real (o `localhost` vía adb port-forward).
   - Confirmar que aparece el banner nativo o el botón "Instalar app" propio
     (`beforeinstallprompt`), que al tocar `appinstalled` dispara y el botón desaparece.
   - Después de instalar, revisar el ícono en el launcher: **es el punto donde se va a ver
     el problema de falta de variante `maskable`** — confirmar visualmente cuánto se recorta
     el logo actual contra la máscara circular, para darle una referencia concreta a quien
     genere los íconos nuevos.
3. **iOS Safari.**
   - Abrir en Safari (no en un navegador embebido de otra app), confirmar que aparece el
     banner "Agregar a pantalla de inicio" (no debería aparecer en Chrome para iOS, que
     también usa WebKit pero no dispara el mismo `userAgent` combinado con `!standalone`
     de la misma forma — vale la pena confirmar el falso negativo/positivo en ambos).
   - Agregar a inicio manualmente, abrir desde el ícono, confirmar standalone.
4. **Actualización de versión.**
   - Con la app ya instalada y abierta, cambiar algo trivial en el código (o subir
     `CACHE_NAME` en `public/sw.js`), rebuild, redeploy.
   - Reabrir/recargar la pestaña: confirmar que aparece el `UpdateBanner` ("Hay una versión
     nueva...") y que el botón "Recargar" efectivamente trae la versión nueva.
   - Confirmar que en la **primera** instalación (sin `controller` previo) el banner NO
     aparece — sólo debe aparecer en actualizaciones sobre una instalación existente.
5. **OAuth de Strava con el SW activo.**
   - Con la PWA instalada y el SW activo, completar el flujo real "Conectar con Strava" de
     punta a punta (`/api/strava/callback` y, más adelante, `/api/strava/refresh` al
     expirar el access token).
   - Confirmar en DevTools → Network que esas peticiones nunca aparecen servidas
     `(from ServiceWorker)` y que las cookies que fija el Frente A (`httpOnly`,
     `strava_connected`) se actualizan con normalidad. Es la verificación más importante de
     todo este frente y la única que de verdad no se puede simular sin credenciales reales.
6. **Offline real.**
   - Con la app abierta y varias pantallas visitadas (dashboard, `/achievements`,
     `/comparative`), cortar la red (modo avión o DevTools → Network → Offline).
   - Confirmar que las pantallas visitadas siguen abriendo con datos (vienen de
     `localStorage`, no del SW — pero el *shell* sí tiene que venir del SW para que la
     pantalla cargue en absoluto).
   - Navegar a una ruta no visitada: confirmar que aparece `offline.html` con el mensaje y
     el botón "Volver al dashboard".
7. **Almacenamiento persistente.**
   - `navigator.storage.persisted()` en DevTools console antes y después de instalar la
     PWA, para confirmar que el permiso efectivamente se concede (suele ser automático post
     instalación en Chrome/Android, no en desktop).

## Salida real de los cuatro comandos

### `npx tsc --noEmit`

Sin salida (exit 0). Limpio.

### `npm run lint`

```
> platenzen-front@0.1.0 lint
> eslint


C:\Users\Usuario\repos\platenzen-front-d\src\components\CoachPersonalizado\index.tsx
  21:3  warning  'CoachImage' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\Usuario\repos\platenzen-front-d\src\components\Dashboard\index.tsx
   68:6  warning  React Hook useEffect has a missing dependency: 'setIsMounted'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  143:6  warning  React Hook useEffect has a missing dependency: 'setIsMobile'. Either include it or remove the dependency array   react-hooks/exhaustive-deps

C:\Users\Usuario\repos\platenzen-front-d\src\lib\achievements.ts
  151:68  warning  'stats' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\Usuario\repos\platenzen-front-d\src\lib\roles.ts
  226:11  warning  'explorador_min_places' is assigned a value but never used  @typescript-eslint/no-unused-vars

✖ 5 problems (0 errors, 5 warnings)
```

Los 5 son preexistentes, ninguno en archivos tocados por este frente.

### `npx jest`

```
Test Suites: 31 passed, 31 total
Tests:       556 passed, 556 total
Snapshots:   0 total
Time:        3.441 s, estimated 8 s
Ran all test suites.
```

Mismo resultado que el baseline corrido antes de empezar (confirmé 31/556 verdes antes de
tocar nada, y de nuevo al cerrar).

### `npm run build`

```
> platenzen-front@0.1.0 build
> next build

▲ Next.js 16.2.6 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 4.3s
  Running TypeScript ...
  Finished TypeScript in 5.5s ...
  Collecting page data using 10 workers ...
  Generating static pages using 10 workers (9/9) in 519ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /achievements
├ ƒ /api/strava/callback
├ ƒ /api/strava/refresh
├ ○ /comparative
└ ○ /manifest.webmanifest

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

`/manifest.webmanifest` aparece en la lista de rutas, estático, como se pedía confirmar.
