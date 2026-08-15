# Feedback — Frente B (modelo canónico)

Escrito a medida que avanzo, como pide el plan.

## project-profile.md desactualizado

Dice "no hay suite configurada". Sí la hay: `npx jest` corre 31 suites / 556 tests
verdes (confirmado antes de tocar nada). Vale la pena que alguien actualice
`project-profile.md` — no lo hago yo porque no es mi territorio y no quiero pisar
el trabajo de otro frente sobre el mismo archivo.

## Paso 1-2: contrato + adapters de Strava

- `src/types/strava.ts`: agregado comentario de encabezado, sin tocar los campos.
- `src/services/strava.ts` → `src/services/providers/strava/api.ts` (movido tal
  cual, sin cambios de lógica) + `src/services/providers/strava/adapter.ts`
  (nuevo, `toActivity`).
- Borrado `src/services/strava.ts`.

## Pasada 1 (tipo) — hecha

24 `src/lib`, 24 `src/components`, 2 `src/hooks`, 2 `src/utils`, `src/types/cache.ts`
y 15 `src/__tests__` (incluye `helpers/activity.ts`) importaban `StravaActivity` como
tipo — 68 archivos en total, en línea con el "~65" del plan (la diferencia es que el
plan contaba sólo lo productivo y yo sumo también los tests, que el propio plan pide
migrar en el mismo paso). Sustitución mecánica vía `sed` (import + todo uso del
identificador como tipo), no archivo por archivo a mano — a esa escala era la
herramienta correcta; verifiqué con `tsc --noEmit` (limpio) y una lectura de muestra
de varios archivos post-sed.

- `src/types/cache.ts`: `CacheData.activities` pasa a `Activity[]`.
- `src/lib/cache.ts`: `CACHE_VERSION` de 1 a 2, con comentario explicando por
  qué (el detalle que el plan marca como el más caro de pasar por alto).
- `src/hooks/useActivities.ts`: importa de
  `@/services/providers/strava/api` en vez de `@/services/strava` (que ya no
  existe) y aplica `toActivity` al resultado crudo antes de cachear/exponer.
  El resto de la lógica (cache, progreso, manejo de error) no se tocó.
- `src/hooks/useStravaData.tsx`: sólo el import de tipo; `StravaDataProvider`
  y `useStravaData` se dejaron con esos nombres, como pide el plan.
- Tests: `helpers/activity.ts` ahora devuelve `Activity` con
  `provider: 'strava'` y `externalId: String(id)` por defecto, derivando
  `externalId` del `id` que ya recibía. `shared/useActivities.test.tsx`
  apunta el `jest.mock` a `@/services/providers/strava/api`.
  `shared/cache.test.ts` tenía dos lugares con `version: 1` fijo (uno
  comprobaba el valor real que devuelve `saveCache`/`loadCache`, ahí lo subí
  a 2; el otro es el helper `at()` de `isCacheFresh`, que no compara versión
  — lo subí igual por prolijidad, no cambia el resultado del test). Otros 13
  archivos de test sólo tenían el import + anotaciones de tipo locales
  (`Partial<StravaActivity>`) sobre datos que igual salen de `activity()`.
- `src/__mocks__/activitiesMock.ts`: no lo toqué, como pide el plan — es un
  volcado JSON sin `import` de `StravaActivity`, así que ni siquiera aparece
  en el grep de este archivo.

Checkpoint entre pasadas: `tsc --noEmit` limpio, `npx jest` 31/31 suites y
556/556 tests verdes, `npm run lint` 0 errores y 5 warnings (el plan decía 6
preexistentes — ver sección de abajo).

## Pasada 2 (vocabulario deportes) — hecha

Los 21 archivos de la tabla del plan (20 en `src/lib` + `TopActivities/index.tsx`).
Cada uno: se borró su `const RUNNING_SPORTS = new Set([...])` local, se agregó
`import { isRunning, isTrailRun } from '@/lib/sports'` (sólo `isRunning` en los
archivos que no comparaban contra `'TrailRun'`), y se aplicaron las tres formas de
la tabla:

- `RUNNING_SPORTS.has(a.sport_type || a.type)` → `isRunning(a)` (17 archivos).
- `(a.sport_type || a.type) === 'TrailRun'` → `isTrailRun(a)`: en
  `achievements.ts`, `roles.ts` (×3), `roleChecklist.ts` y `runnerProfile.ts`.
- `RUNNING_SPORTS.has(a.sport_type)` (sin el respaldo `|| a.type`) → `isRunning(a)`
  en `recap.ts:11` y `:48`. Ver "Desvíos" abajo.

Automaticé la inserción del import y el borrado de la constante con un script
Python (no `sed` para esa parte: necesitaba insertar en una posición exacta del
archivo, no un patrón de una sola línea) y dejé la sustitución de los usos con
`sed` porque las tres formas de la tabla son literales idénticos en los 21
archivos. Cada import se insertó pegado a la última línea de import existente,
salvo cuando eso generó una línea en blanco doble alrededor de donde estaba la
constante borrada — pasé una limpieza de "3+ saltos de línea → 2" sobre esos
mismos 21 archivos para dejarlo con el mismo espaciado de una línea en blanco que
ya usa el resto del archivo (confirmado a ojo en varios de ellos, no es un cambio
de contenido).

Checkpoint final: `tsc --noEmit` limpio, `npx jest` 31/31 suites y 556/556 tests
verdes, `npm run lint` 0 errores y 5 warnings (sin cambios respecto al checkpoint
de la pasada 1 — ninguno de los 5 está en un archivo que toqué en esta pasada),
`npm run build` limpio. `grep -rn "StravaActivity" src/lib src/utils src/components
src/hooks` vacío (criterio de cierre del plan).

## Desvíos

- **`recap.ts` (autorizado explícitamente por el plan).** `computeMonthlyRecap` y
  `computeAnnualRecap` filtraban con `RUNNING_SPORTS.has(a.sport_type)`, sin el
  respaldo `|| a.type` que sí tiene `isRunning()`. Al reemplazar por `isRunning(a)`
  una actividad vieja con `sport_type` vacío (que antes quedaba afuera del recap y
  adentro de todos los demás cálculos) ahora entra también al recap. No hay
  `recap.test.ts` en el repo — no hay test que haya cambiado de resultado, así que
  no hay nada roto que mostrar, pero **quien integre debería saber que el recap de
  meses/años viejos puede sumar actividades que antes no contaba**, en particular
  para usuarios con historial de antes de que Strava mandara `sport_type` de forma
  consistente.
- **Warnings de lint: 5, no 6.** El plan dice "6 warnings preexistentes". Encontré
  5 ya en el checkpoint de la pasada 1 (antes de tocar los 21 archivos de la pasada
  2), así que no es algo que yo haya arreglado — probablemente el plan se escribió
  contra un estado del repo con un warning más en algún archivo que no es mío. No
  investigué más porque no es mi territorio y remover uno de esos 5 sería tocar
  código que el plan pide no tocar. Los 5 archivos con warning:
  `CoachPersonalizado/index.tsx`, `Dashboard/index.tsx` (×2), `lib/achievements.ts`,
  `lib/roles.ts` — dos de estos últimos sí son archivos que toqué (pasada 2), pero
  los warnings son preexistentes y no tienen relación con `RUNNING_SPORTS`/`Activity`
  (uno es un parámetro `stats` sin usar en una función de `achievements.ts`, el otro
  una destructuración sin usar en `roles.ts`); no los arreglé porque el plan dice
  explícitamente "no los arregles".
- **`RoleTree.tsx`: variante fuera de la tabla, no tocada.** Declara
  `const RUNNING = new Set(['Run', 'TrailRun', 'VirtualRun'])` **dos veces**, como
  variable local dentro de `countMilestones()` y `calcTrailRatio()` (no a nivel de
  módulo, y con otro nombre — no es una de las tres formas de la tabla). No está en
  la lista de 21 archivos y además vive en `src/components/`, donde mi territorio es
  "sólo imports de tipo, ni una línea de JSX ni de lógica" — así que la dejé
  exactamente como está, incluido el uso de `StravaActivity` → sólo cambié eso a
  `Activity` en las firmas de tipo, sin tocar la lógica interna. Queda pendiente de
  integración (ver abajo).

## Deuda preexistente vista al pasar

- `src/lib/stats.ts:22` (`const sport = act.sport_type || act.type;`) — no es una
  variante de `RUNNING_SPORTS`, es la agrupación por deporte para `SportCount`
  (cuenta actividades por tipo, no filtra corridas). La dejé intacta, la anoto sólo
  porque coincide superficialmente con el patrón de la tabla y no quiero que se
  confunda con algo que quedó sin migrar.
- Los 5 warnings de lint preexistentes ya descritos arriba (`CoachPersonalizado`,
  `Dashboard` ×2, `achievements.ts`, `roles.ts`).

## Pendiente de integración (territorio ajeno)

- `src/components/PersonajeCard/RoleTree.tsx` tiene su propia copia de
  `RUNNING_SPORTS` (como `RUNNING`, ver "Desvíos"). No es mi territorio unificarla
  con `@/lib/sports` porque tocar la lógica de un componente está fuera de mi
  alcance — sí lo está el tipo, que ya migré. Alguien con permiso sobre
  `src/components/**` más allá de imports de tipo debería limpiarla.
- Verifiqué `AppClient/index.tsx` y `useToken.ts` (territorio del frente A) antes de
  arrancar: ninguno importa `StravaActivity` ni `Activity`, así que mi renombre no
  los tocó y no hizo falta abrirlos.
- No toqué `src/app/api/strava/**`, `src/app/layout.tsx`, `src/app/manifest.ts`,
  `public/**`, `src/components/pwa/**`, `next.config.ts`,
  `src/services/providers/garmin/**`, `src/lib/polylineEncoder.ts` ni
  `docs/matriz-proveedores.md` — todos territorio ajeno, ninguno lo necesitaba para
  que mi parte compile (`tsc --noEmit` y `npm run build` limpios lo confirman).
- `package.json` no se tocó.

## Inventario de qué merece test

Nada de esto se escribió como test (el plan lo pide explícito). Lo que la próxima
pasada de cobertura debería cubrir:

- **`mergeActivities` (`src/lib/mergeActivities.ts`, nuevo)**: dedup por
  `provider:externalId` (no por `id`), gana la última entrada ante clave repetida,
  orden resultante por `start_date` descendente, lista vacía, una sola lista (no-op
  con reordenamiento), y el caso central — dos proveedores con el mismo `id`
  numérico pero distinto `provider`/`externalId` no se pisan.
- **`toActivity` (`src/services/providers/strava/adapter.ts`, nuevo)**: identidad de
  los campos que vienen del payload de Strava, `provider` siempre `'strava'`,
  `externalId` siempre `String(raw.id)` incluso con ids grandes.
- **`src/lib/sports.ts`** (ya existía sin consumidores, ahora con 21+2): `deporte()`
  con y sin `sport_type`, `isRunning()`/`isTrailRun()` sobre los tres tipos del Set y
  sobre un deporte no-running (`Ride`), y el caso límite de `sport_type` vacío
  cayendo al `type`.
- **El cambio de comportamiento de `recap.ts`**: una actividad con `sport_type: ''`
  y `type: 'Run'` — antes de esta pasada quedaba afuera de
  `computeMonthlyRecap`/`computeAnnualRecap`, ahora entra. No hay
  `recap.test.ts` hoy; si se escribe, este es el caso que hay que fijar para que no
  se revierta sin querer.
- **`CACHE_VERSION = 2`**: que `loadCache()` descarte un blob guardado con
  `version: 1` (formato viejo sin `provider`/`externalId`), no sólo `version: 99`
  como ya cubre `cache.test.ts`.

## Verificación de cierre

Salida real, corrida al final de las dos pasadas:

```
$ npx tsc --noEmit
(sin output — limpio)

$ npm run lint
> platenzen-front@0.1.0 lint
> eslint

C:\Users\Usuario\repos\platenzen-front-b\src\components\CoachPersonalizado\index.tsx
  21:3  warning  'CoachImage' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\Usuario\repos\platenzen-front-b\src\components\Dashboard\index.tsx
   68:6  warning  React Hook useEffect has a missing dependency: 'setIsMounted'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  143:6  warning  React Hook useEffect has a missing dependency: 'setIsMobile'. Either include it or remove the dependency array   react-hooks/exhaustive-deps

C:\Users\Usuario\repos\platenzen-front-b\src\lib\achievements.ts
  150:62  warning  'stats' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\Usuario\repos\platenzen-front-b\src\lib\roles.ts
  225:11  warning  'explorador_min_places' is assigned a value but never used  @typescript-eslint/no-unused-vars

✖ 5 problems (0 errors, 5 warnings)

$ npx jest
Test Suites: 31 passed, 31 total
Tests:       556 passed, 556 total
Snapshots:   0 total
Time:        3.173 s

$ npm run build
> platenzen-front@0.1.0 build
> next build
▲ Next.js 16.2.6 (Turbopack)
✓ Compiled successfully in 2.9s
  Running TypeScript ...
  Finished TypeScript in 4.3s ...
✓ Generating static pages using 9 workers (8/8) in 403ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /achievements
├ ƒ /api/strava/callback
├ ƒ /api/strava/refresh
└ ○ /comparative

$ grep -rn "StravaActivity" src/lib src/utils src/components src/hooks
(sin output — vacío, criterio de cierre cumplido)
```
