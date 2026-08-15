# Frente B — El dominio deja de hablar Strava

**Worktree:** `c:\Users\Usuario\repos\platenzen-front-b`
**Rama:** `frente/b-modelo-canonico`
**Modelo sugerido:** Sonnet

Trabajás solo, en un worktree aislado, sobre un repo que no viste antes. Este documento
tiene que alcanzarte: no hay conversación previa que consultar.

Tu frente es el más grande de los cuatro en cantidad de archivos y el más chico en
decisiones: casi todo es sustitución mecánica. **Las decisiones ya están tomadas más
abajo, y la mayoría son "no cambies eso".**

---

## Para qué

Platenzen va a recibir actividades de Garmin además de Strava. El objetivo, textual del
pedido:

> *"Garmin funciona dentro de Platenzen como una nueva fuente de datos, sin que el resto de
> Platenzen tenga que saber que existe Garmin."*

Vos no implementás Garmin — eso es el frente C. Vos construís la costura por la que va a
entrar: un contrato canónico de actividad y una capa de adapters por proveedor. Al
terminar, `src/lib/` no debería importar nada llamado "Strava".

---

## Lo que ya existe y no tenés que diseñar

Estos dos archivos **ya están en tu rama base**, commiteados antes de que arrancaras.
Leelos antes de tocar nada: son tu contrato, no una sugerencia.

- **`src/types/activity.ts`** — la interfaz `Activity` y el tipo `ProviderId`. Es el
  contrato canónico.
- **`src/lib/sports.ts`** — `RUNNING_SPORTS`, `deporte()`, `isRunning()`, `isTrailRun()`.

Ninguno tiene consumidores todavía. Conectarlos es tu trabajo.

**Ojo:** el frente C también parte de estos dos archivos. Si les cambiás la forma, rompés
un frente que no podés ver. Si encontrás un motivo fuerte para modificarlos, **no lo
hagas**: anotalo en tu feedback y seguí con la forma que tienen.

---

## Territorio

**Tuyo:**

- `src/types/strava.ts`, `src/types/cache.ts`
- `src/lib/**` — **excepto** `src/lib/sports.ts` (ya está hecho, sólo se consume) y
  `src/lib/polylineEncoder.ts` (lo crea el frente C; **no lo crees vos**)
- `src/utils/**`
- `src/services/**` — **excepto** `src/services/providers/garmin/**` (frente C)
- `src/hooks/useActivities.ts`, `src/hooks/useStravaData.tsx`
- `src/components/**` — **sólo** para actualizar imports de tipo. No toques ni una línea
  de JSX ni de estilos.
- `src/__tests__/**` y `src/__mocks__/**` — sólo lo que rompa tu renombre.

**Ajeno — no lo toques aunque veas algo mejorable:**

- **`src/hooks/useToken.ts` y `src/components/AppClient/index.tsx`** son del **frente A**,
  que está reescribiendo la persistencia de la sesión de Strava. Verificá antes de
  empezar: `AppClient` **no** importa `StravaActivity`, así que tu renombre no debería
  obligarte a tocarlo. Si te parece que sí, es señal de que estás cambiando algo de más.
- `src/app/api/strava/**` — frente A.
- `src/app/layout.tsx`, `src/app/manifest.ts`, `public/**`, `src/components/pwa/**`,
  `next.config.ts` — **frente D** (PWA).
- `src/services/providers/garmin/**`, `src/lib/polylineEncoder.ts`,
  `docs/matriz-proveedores.md` — **frente C**.

**No toques `package.json`.**

---

## Qué construir

### 1. `src/types/strava.ts` pasa a ser el payload crudo

No lo borres ni lo renombres. `StravaActivity` describe **exactamente** lo que devuelve la
API de Strava, y ese sigue siendo un tipo necesario: es la entrada del adapter. Lo único
que cambia es quién lo importa — después de tu trabajo, sólo el cliente y el adapter de
Strava.

Agregale un comentario de encabezado diciendo eso, para que el próximo que lo abra no lo
confunda con el modelo del dominio.

### 2. Los adapters de proveedor

Creá:

```
src/services/providers/strava/api.ts       ← movido tal cual desde src/services/strava.ts
src/services/providers/strava/adapter.ts   ← nuevo
```

y **borrá `src/services/strava.ts`**. Su único consumidor real es
`src/hooks/useActivities.ts` (y el `jest.mock('@/services/strava')` de
`src/__tests__/shared/useActivities.test.tsx`, que tenés que apuntar a la ruta nueva).

- **`api.ts`**: el contenido actual de `src/services/strava.ts`, sin cambios de lógica.
  Sigue devolviendo `StravaActivity[]` **crudo**. `StravaError` se muda con él.
- **`adapter.ts`**: exporta `toActivity(raw: StravaActivity): Activity`. Es casi la
  identidad — ese es el punto, y conviene que se note:

  ```ts
  export function toActivity(raw: StravaActivity): Activity {
    return {
      ...raw,
      provider: 'strava',
      externalId: String(raw.id),
    };
  }
  ```

  Si te sale de una línea, está bien. Un adapter que no tiene nada que traducir es la
  prueba de que el contrato canónico se eligió sobre el vocabulario que el dominio ya
  hablaba, no sobre uno inventado.

### 3. La sustitución mecánica

Dos pasadas sobre el árbol. Hacelas por separado y verificá entre una y otra.

**Pasada 1 — el tipo.** En `src/lib/**`, `src/utils/**`, `src/components/**`,
`src/hooks/useActivities.ts`, `src/hooks/useStravaData.tsx` y `src/types/cache.ts`:

```
import { StravaActivity } from '@/types/strava';   →   import { Activity } from '@/types/activity';
```

y todo uso de `StravaActivity` como tipo pasa a `Activity`. Son ~65 archivos. **Es sólo el
tipo**: no toques nombres de variables, ni de props, ni de funciones. `StravaDataProvider`
y `useStravaData` **se quedan como están** — los consume el frente A y las tres páginas de
`src/app/(app)/`, y renombrarlos es churn que además pisa territorio ajeno.

**Pasada 2 — el vocabulario de deportes.** Estos 21 archivos declaran su propia copia de
`const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun'])`:

```
src/components/TopActivities/index.tsx   src/lib/personalRecords.ts
src/lib/achievements.ts                  src/lib/racePredictor.ts
src/lib/coach.ts                         src/lib/recap.ts
src/lib/coachAnalisis.ts                 src/lib/recordHistory.ts
src/lib/coreRecord.ts                    src/lib/roleChecklist.ts
src/lib/formShape.ts                     src/lib/roles.ts
src/lib/lastActivity.ts                  src/lib/runnerDNA.ts
src/lib/legendarySessions.ts             src/lib/runnerProfile.ts
src/lib/milestones.ts                    src/lib/stats.ts
src/lib/periodComparison.ts              src/lib/worldMap.ts
                                         src/lib/xpSystem.ts
```

En cada uno: borrá la constante local e importá de `@/lib/sports`. Las formas que vas a
encontrar y su reemplazo exacto:

| Antes | Después |
|---|---|
| `RUNNING_SPORTS.has(a.sport_type \|\| a.type)` | `isRunning(a)` |
| `(a.sport_type \|\| a.type) === 'TrailRun'` | `isTrailRun(a)` |
| `RUNNING_SPORTS.has(a.sport_type)` | `isRunning(a)` |

**Cuidado con la tercera fila**: `src/lib/recap.ts:11` y `:48` usan `a.sport_type` **sin el
respaldo `|| a.type`**. `isRunning()` sí aplica el respaldo, así que ahí estás cambiando
comportamiento — para bien: una actividad vieja con `sport_type` vacío hoy queda afuera del
recap y adentro de todos los demás cálculos, que es una inconsistencia, no una decisión.
**Hacé el cambio y anotalo en el feedback** como desvío consciente, para que quien integre
sepa que ese módulo cambió de resultado.

Si en algún archivo encontrás una tercera variante que no está en la tabla, **no
improvises**: dejala como está y anotala en el feedback.

### 4. `src/lib/mergeActivities.ts` (nuevo)

La deduplicación, que hoy no existe porque con un solo proveedor no hacía falta:

```ts
export function mergeActivities(...listas: Activity[][]): Activity[]
```

- La clave es **`${provider}:${externalId}`**, nunca `id` solo. Dos proveedores pueden
  emitir el mismo número y `Activity.id` no garantiza unicidad entre ellos — está
  documentado en `src/types/activity.ts` y es el motivo de que `externalId` exista.
- Ante clave repetida **gana la última**. Así una resincronización con datos corregidos
  actualiza en vez de ser ignorada, y volver a correr una sincronización dos veces es
  seguro (idempotente).
- Devolvé ordenado por `start_date` descendente, que es como el dominio espera las
  actividades.

Con un solo proveedor conectado esta función es un `no-op` caro, y está bien: es la pieza
que hace que conectar el segundo no requiera tocar nada más.

### 5. La caché, y el detalle que arruina el despliegue si se pasa por alto

`src/lib/cache.ts` guarda las actividades en `localStorage` con
`const CACHE_VERSION = 1`. Todo lo que hay guardado hoy en los navegadores de los usuarios
está en el formato viejo: **sin `provider` y sin `externalId`**.

**Subí `CACHE_VERSION` a `2`.** `loadCache()` ya descarta lo que no coincide con la
versión, así que con eso alcanza: el usuario vuelve a bajar su historial una vez y a partir
de ahí todo tiene identidad. Si no lo hacés, la app arranca con actividades sin proveedor,
`mergeActivities` las colapsa en una sola (clave `undefined:undefined`) y el dashboard
queda vacío sin ningún error visible. Es el fallo más caro que este frente puede
introducir y el más fácil de evitar.

### 6. `src/hooks/useActivities.ts`

- Pasa a trabajar con `Activity[]`.
- Importa de `@/services/providers/strava/api` y aplica `toActivity` a lo que vuelve.
- El resto de la lógica —caché, progreso, manejo de errores— **no se toca**. Hoy funciona.

### 7. Los tests que ya existen

Tienen que seguir pasando; algunos van a romper por el renombre. Arreglos esperables:

- `src/__tests__/helpers/activity.ts`: la factory pasa a devolver `Activity`. Agregale
  `provider: 'strava'` y `externalId: String(id)` a los valores por defecto, derivando
  `externalId` del `id` que ya calcula.
- `src/__tests__/shared/useActivities.test.tsx`: la ruta del `jest.mock` cambia a
  `@/services/providers/strava/api`.
- `src/__tests__/shared/cache.test.ts`: puede estar fijando `version: 1`.
- El resto: cambios de import.

`src/__mocks__/activitiesMock.ts` es un volcado real de la API de Strava y **no lo importa
nadie**. Dejalo como está; no lo adaptes ni lo borres. Anotalo en el feedback.

---

## Qué NO hacer

- **No renombres campos del contrato canónico.** `distance`, `moving_time`,
  `average_speed`, `start_date_local` se quedan con esos nombres. La decisión está tomada y
  documentada en `src/types/activity.ts`: son el vocabulario que el dominio ya hablaba, y
  "neutralizarlos" cuesta 30 archivos a cambio de nada. `moving_time` no es peor que
  `movingTimeSeconds`, sólo distinto.
- **No toques la lógica de ningún cálculo.** Nivel, XP, récords, predicciones y
  consistencia son la promesa del producto según el `AGENTS.md` de este repo: una fórmula
  mal tocada le miente al corredor sobre su progreso. Tu frente cambia **de dónde viene el
  dato**, nunca qué se hace con él. Si un test de cálculo cambia de resultado, salvo el
  caso de `recap.ts` que este plan ya autorizó, es un bug tuyo.
- **No agregues campos a `Activity`** porque Garmin los tenga. Cadencia, calorías, laps y
  streams **no** entran: hoy ningún cálculo los usa, y el pedido es explícito en no meter
  al contrato lo que el producto no consume. El frente C los documenta como oportunidad.
- **No escribas tests nuevos.** Los que ya existen tienen que quedar verdes; para el código
  nuevo (`mergeActivities`, los adapters, `sports.ts`) dejás **inventario** en el feedback,
  no tests. Trabajás aislado: un test escrito ahora contra tu suposición de cómo va a
  quedar el frente C describe algo que quizás nunca exista. La pasada de cobertura se hace
  una sola vez sobre el resultado integrado.
- **No crees `src/lib/polylineEncoder.ts`.** Es del frente C.

---

## Verificación de cierre

```bash
npx tsc --noEmit
npm run lint
npx jest
npm run build
```

Piso heredado: **556 tests en 31 suites, todos verdes; lint 0 errores y 6 warnings
preexistentes; build limpio.** Los 6 warnings no son tuyos, no los arregles.

**Un `grep -rn "StravaActivity" src/lib src/utils src/components src/hooks` tiene que
volver vacío al terminar.** Es el criterio objetivo de que el dominio dejó de hablar
Strava. `src/types/strava.ts` y `src/services/providers/strava/**` sí lo mencionan, y así
tiene que ser.

Pegá la salida real de los cuatro comandos en tu feedback, no un "quedó todo bien".

---

## Feedback

Dejá `docs/feedback-frente-b.md`, **escrito a medida que avanzás, no al final**:

- Decisiones donde el plan dejaba margen, y por qué.
- Desvíos, explicados. El de `recap.ts` ya sabés que va acá.
- Variantes de `RUNNING_SPORTS` fuera de la tabla, si aparecieron.
- Pendiente de integración: territorio ajeno que hacía falta tocar y no tocaste.
- Deuda preexistente vista al pasar, con archivo y línea. No la arregles.
- **Inventario de qué merece test**: `mergeActivities` (dedup, orden, lista vacía, misma
  actividad de dos proveedores), `toActivity`, `sports.ts`, y el cambio de comportamiento
  de `recap.ts`.
- La salida real de la verificación.
