# Frente C — Garmin entra por la costura

**Worktree:** `c:\Users\Usuario\repos\platenzen-front-c`
**Rama:** `frente/c-garmin`
**Modelo sugerido:** Sonnet

Trabajás solo, en un worktree aislado, sobre un repo que no viste antes. Este documento
tiene que alcanzarte: no hay conversación previa que consultar.

Tu frente es el único que crea **sólo archivos nuevos**. No modificás ni una línea de código
existente. Eso te da libertad y también responsabilidad: nadie va a chocar con vos, y nadie
va a atajar un error tuyo.

---

## Lo primero, porque cambia cómo leés todo lo demás

**El adapter que vas a escribir no se va a poder ejecutar contra Garmin, y eso ya se sabe.**

Tres hechos, verificados contra la documentación oficial antes de escribir este plan:

1. El **Garmin Connect Developer Program es sólo para empresas** ("it is only for business
   use", según su propio FAQ). No admite uso personal ni proyectos hobby.
2. Requiere **aprobación**, y hay reportes de 2026 de que las solicitudes nuevas están
   **pausadas sin fecha de reapertura**.
3. Aun con acceso, Garmin **no tiene un endpoint de "traeme mis actividades"**. Entrega por
   **push a una callback URL pública**, o por **ping + pull** contra una URL que Garmin te
   manda. Los dos modelos exigen un servidor que reciba avisos **cuando el usuario no está
   en la página**, y Platenzen no tiene backend con persistencia: sus dos rutas de
   `src/app/api/strava/*` son proxies sin estado.

La decisión, ya tomada por quien pidió el trabajo: **se escribe el mapper igual**, contra
la documentación oficial, con las estructuras de payload reales. Queda listo para el día
que exista el acceso y el backend, y sirve ahora como prueba de que la abstracción del
frente B aguanta un segundo proveedor.

Lo que **no** se hace: no inventes un flujo OAuth de Garmin, no escribas rutas de API, no
simules un backend. **Nada de tu código se enchufa a la app en esta tanda.** El adapter es
una función pura de payload a `Activity`, y hasta ahí llega. Escribir un botón "Conectar
Garmin" que no puede funcionar es peor que no escribirlo.

---

## Lo que ya existe y es tu contrato

Estos archivos **ya están en tu rama base**. Leelos antes de escribir nada:

- **`src/types/activity.ts`** — la interfaz `Activity`. Es lo que tu mapper tiene que
  producir. Leé con atención el comentario de `start_date_local`: ahí está el error más
  caro que podés cometer.
- **`src/lib/sports.ts`** — el vocabulario de deportes. Tu mapper traduce **hacia** él.

**No los modifiques.** El frente B está trabajando en paralelo sobre los archivos que los
consumen; si les cambiás la forma, rompés un frente que no podés ver. Si encontrás un
motivo fuerte para cambiarlos, anotalo en el feedback y seguí con la forma que tienen.

---

## Territorio

**Tuyo, todo nuevo:**

- `src/services/providers/garmin/**`
- `src/lib/polylineEncoder.ts`
- `docs/matriz-proveedores.md`

**Ajeno — no toques nada más.** Tres frentes corren en paralelo:

- **Frente A**: `src/app/api/strava/**`, `src/hooks/useToken.ts`,
  `src/components/AppClient/index.tsx`, `src/components/TokenInput/**`.
- **Frente B**: `src/types/strava.ts`, `src/lib/**` (salvo tu `polylineEncoder.ts`),
  `src/utils/**`, `src/services/providers/strava/**`, `src/hooks/useActivities.ts`,
  `src/components/**`, los tests existentes.
- **Frente D**: `src/app/layout.tsx`, `src/app/manifest.ts`, `public/**`,
  `src/components/pwa/**`, `next.config.ts`.

**No toques `package.json`.** En particular: **no agregues el FIT SDK de Garmin.** Los
payloads de la Activity API llegan en JSON; el FIT es un formato alternativo de descarga
que Platenzen no necesita, y sumar un decoder binario para datos que ningún cálculo del
producto consume es peso muerto.

---

## Qué construir

### 1. `src/lib/polylineEncoder.ts`

Ya existe `src/lib/polylineDecoder.ts` con `decodePolyline(encoded): [number, number][]`,
que implementa el algoritmo de polyline codificada de Google. Necesitás la inversa:

```ts
export function encodePolyline(coords: [number, number][]): string
```

**Por qué existe esto y no una segunda forma de guardar el GPS:** Strava entrega la traza
como polyline codificada en `map.summary_polyline`, y cinco lugares del producto la
consumen decodificándola — `src/lib/worldMap.ts`, `src/lib/explorationUtils.ts`,
`src/lib/coachAnalisis.ts`, `src/components/UltimaActividad/`,
`src/components/CoachAnalisis/`. Garmin entrega coordenadas sueltas por sample. Si el
adapter las **codifica**, esos cinco lugares no se enteran de que Garmin existe. Si en
cambio agregáramos un campo `coordenadas` al contrato canónico, habría que enseñarle a los
cinco a manejar dos formatos. Codificar es el trabajo del adapter; el dominio ya tiene su
formato y no se toca.

Requisito de correctitud, y es el único que importa: **`decodePolyline(encodePolyline(c))`
tiene que devolver `c` con la precisión de 5 decimales del formato** (el algoritmo redondea
a 1e-5; no esperes igualdad exacta en flotantes, sí en el valor redondeado). Verificalo a
mano contra el decoder que ya está, y contra el caso que su test ya usa
(`src/__tests__/shared/polylineDecoder.test.ts` decodifica `'_p~iF~ps|U_ulLnnqC_mqNvxq`@'`
a `[[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]`): codificar esas tres
coordenadas tiene que devolver esa cadena.

Manejá el caso de lista vacía devolviendo `''` — el decoder ya trata `''` como `[]`.

### 2. `src/services/providers/garmin/types.ts`

Los payloads de Garmin, tipados. **En la API los campos van en `camelCase`** (la
documentación de exportación de algunos integradores los muestra en `PascalCase`; ese no es
el formato del push).

**Activity Summary** — lo que llega en el push de actividades:

```ts
export interface GarminActivitySummary {
  summaryId: string;              // identidad estable → externalId
  activityId?: number;            // id numérico de la actividad en Garmin Connect
  activityName?: string;
  activityType: string;           // enum, ver tabla más abajo
  startTimeInSeconds: number;     // epoch UTC, en SEGUNDOS
  startTimeOffsetInSeconds: number; // offset local respecto de UTC
  durationInSeconds: number;
  distanceInMeters?: number;
  averageSpeedInMetersPerSecond?: number;
  maxSpeedInMetersPerSecond?: number;
  averageHeartRateInBeatsPerMinute?: number;
  maxHeartRateInBeatsPerMinute?: number;
  averagePaceInMinutesPerKilometer?: number;
  totalElevationGainInMeters?: number;
  activeKilocalories?: number;
  averageRunCadenceInStepsPerMinute?: number;
  steps?: number;
  deviceName?: string;
  isParent?: boolean;             // actividad multideporte contenedora
  parentSummaryId?: string;
  manual?: boolean;
}
```

**Activity Details** — el payload separado, con las series temporales:

```ts
export interface GarminSample {
  latitudeInDegree?: number;
  longitudeInDegree?: number;
  elevationInMeters?: number;
  heartRate?: number;
  speedMetersPerSecond?: number;
  stepsPerMinute?: number;
  powerInWatts?: number;
  totalDistanceInMeters?: number;
  timerDurationInSeconds?: number;
  clockDurationInSeconds?: number;
  movingDurationInSeconds?: number;
  airTemperatureCelcius?: number;   // sic: Garmin lo escribe así
}

export interface GarminLap {
  startTimeInSeconds: number;
}

export interface GarminActivityDetails {
  summary: GarminActivitySummary;
  samples?: GarminSample[];
  laps?: GarminLap[];
}
```

Casi todo va opcional a propósito: **Garmin omite el campo cuando el dispositivo no lo
midió**, no manda cero. Un reloj sin GPS no manda coordenadas; una corrida sin banda
cardíaca no manda pulso. Tipar eso como obligatorio te empuja a inventar valores.

### 3. `src/services/providers/garmin/sportTypes.ts`

El mapeo del enum de Garmin al vocabulario de `src/lib/sports.ts`:

| `activityType` de Garmin | `sport_type` canónico | Por qué |
|---|---|---|
| `RUNNING` | `Run` | |
| `STREET_RUNNING` | `Run` | |
| `TRACK_RUNNING` | `Run` | |
| `TRAIL_RUNNING` | `TrailRun` | Platenzen distingue trail; hay logros que dependen de esto |
| `ULTRA_RUNNING` | `TrailRun` | |
| `TREADMILL_RUNNING` | `VirtualRun` | Cinta: sin GPS y sin desnivel real, igual que el virtual de Strava |
| `INDOOR_RUNNING` | `VirtualRun` | |
| `VIRTUAL_RUNNING` | `VirtualRun` | |
| `OBSTACLE_COURSE_RACING` | `Run` | |
| `CYCLING`, `ROAD_BIKING`, `MOUNTAIN_BIKING`, `INDOOR_CYCLING` | `Ride` | |
| `LAP_SWIMMING`, `OPEN_WATER_SWIMMING` | `Swim` | |
| `WALKING`, `HIKING` | `Walk`, `Hike` | |

Un `activityType` **desconocido** no se fuerza a `Run`. Devolvé el valor de Garmin tal cual
(o un `'Workout'` genérico) y que quede afuera de los cálculos de carrera: meter una sesión
de yoga en el promedio de ritmo del corredor es peor que no contarla. Anotá esta decisión
en el feedback.

Exportá también, comentado, el criterio: **este mapeo es una traducción hacia el
vocabulario de Strava y eso es deliberado** — es el vocabulario que el dominio ya hablaba,
no un accidente.

### 4. `src/services/providers/garmin/adapter.ts`

```ts
export function toActivity(
  summary: GarminActivitySummary,
  details?: GarminActivityDetails,
): Activity
```

El mapeo campo por campo:

| Campo canónico | De dónde sale |
|---|---|
| `provider` | `'garmin'` |
| `externalId` | `summary.summaryId` |
| `id` | `summary.activityId ?? 0` — ver la nota de abajo |
| `name` | `summary.activityName`, y si falta, una etiqueta derivada del tipo |
| `type` / `sport_type` | `sportTypes.ts` |
| `distance` | `distanceInMeters ?? 0` |
| `moving_time` | `movingDurationInSeconds` del último sample si está, si no `durationInSeconds` |
| `elapsed_time` | `durationInSeconds` |
| `total_elevation_gain` | `totalElevationGainInMeters ?? 0` |
| `start_date` | `new Date(startTimeInSeconds * 1000).toISOString()` |
| `start_date_local` | **leé la trampa, abajo** |
| `average_speed` | `averageSpeedInMetersPerSecond`; si falta, derivalo de distancia/duración |
| `max_speed` | `maxSpeedInMetersPerSecond ?? 0` |
| `average_heartrate` | `averageHeartRateInBeatsPerMinute` — **dejalo `undefined` si no vino** |
| `max_heartrate` | `maxHeartRateInBeatsPerMinute` — idem |
| `map.summary_polyline` | `encodePolyline` sobre los samples con lat **y** lon |
| `kudos_count` / `athlete_count` | **no los pongas.** Garmin no tiene kudos |

**La trampa de `start_date_local`, que es donde este mapper se rompe si se escribe rápido.**

Strava manda la hora local con un sufijo `Z` que miente: una salida de las 18:13 en Buenos
Aires llega como `"2026-05-25T18:13:24Z"`. No es un bug heredado — es el contrato que el
dominio lee **de las dos maneras**, cortando el string
(`src/lib/stats.ts:36` hace `start_date_local.slice(11, 13)` para la hora) y con
`new Date()` (`src/utils/grouping.ts:26`), y las dos dan la hora local correcta sólo gracias
a ese `Z`.

Entonces:

```ts
const localMs = (summary.startTimeInSeconds + summary.startTimeOffsetInSeconds) * 1000;
const start_date_local = new Date(localMs).toISOString().replace(/\.\d{3}Z$/, 'Z');
```

Sumás el offset **antes** de formatear y dejás la `Z`. Si en cambio emitís el offset real
(`-03:00`), las actividades de Garmin se corren tres horas en el mapa de calor y en la
distribución horaria, sólo para ese proveedor, en silencio y sin ningún error. Aplicá el
mismo `.replace(...)` a `start_date`: Strava no manda milisegundos y conviene que los dos
proveedores produzcan cadenas de la misma forma.

**Nota sobre `id`:** el contrato dice explícitamente que `id` **no** es la identidad —
para eso está `provider + externalId`. Garmin a veces no manda `activityId` en el summary.
Un `0` de relleno es aceptable porque nada de la identidad depende de él; lo que **no** es
aceptable es derivar un número del `summaryId` con un hash y aparentar un id real.

**Actividades multideporte:** si `summary.isParent === true`, es un contenedor y sus hijos
llegan por separado con `parentSummaryId`. Contar las dos cosas duplica distancia.
Filtralas: exportá un `esActividadContenedora(summary): boolean` y documentá que quien
sincronice tiene que descartarlas. No lo resuelvas adentro de `toActivity` — una función
que a veces devuelve `Activity` y a veces nada es peor de usar.

**Actividades cargadas a mano** (`manual: true`): se mapean normal. Strava también las
tiene y Platenzen no las distingue.

**Nunca inventes un valor.** Si Garmin no mandó pulso, `average_heartrate` queda
`undefined`, no `0`. Un cero es un dato falso que los promedios sí van a levantar; un
`undefined` es la verdad. Ese es el motivo de que casi todos los campos del summary estén
tipados opcionales.

### 5. `docs/matriz-proveedores.md`

La matriz de equivalencias, que es un entregable pedido explícitamente. Tres secciones:

1. **Concepto Platenzen ↔ Strava ↔ Garmin ↔ tratamiento**, una fila por campo de
   `Activity`. Marcá cuáles son mapeo directo, cuáles derivación (el ritmo, que Platenzen
   calcula de `average_speed` en `src/utils/pace.ts` y no toma del proveedor), y cuáles no
   existen del otro lado (`kudos_count`).
2. **Lo que Garmin ofrece y Platenzen todavía no muestra**, que es el punto que quien pidió
   el trabajo marcó como "si queda documentado, mejor": cadencia
   (`averageRunCadenceInStepsPerMinute`), calorías (`activeKilocalories`), pasos, potencia,
   temperatura, laps, y las series por segundo de los samples. Para cada uno, decí **si
   Strava también lo tiene** — porque una métrica que existe en los dos proveedores se
   puede mostrar sin romper la paridad, y una que sólo tiene Garmin le pondría al dashboard
   un hueco visible según de dónde vino la actividad. Esa distinción es la que hace útil
   esta sección; sin ella es una lista de deseos.
3. **Lo que falta para que Garmin funcione de verdad**: acceso al programa (empresa +
   aprobación), un backend con persistencia que reciba los push, el flujo OAuth 2.0 PKCE, y
   el backfill inicial. Sin tono de disculpa: es el estado real y sirve para decidir.

---

## Qué NO hacer

- **No agregues campos a `Activity`.** Cadencia, calorías, laps y streams **no** entran al
  contrato canónico: hoy ningún cálculo del producto los usa, y el pedido es explícito en
  no meterle al contrato lo que el producto no consume. Van a la sección 2 de la matriz.
- **No escribas rutas de API, ni OAuth de Garmin, ni UI de conexión.** Ver el primer
  bloque de este documento.
- **No agregues dependencias.** Ni el FIT SDK, ni una librería de polyline: el encoder son
  ~20 líneas y el decoder que ya está es la especificación a la que tenés que coincidir.
- **No escribas tests.** Sí: dejá en el feedback el **inventario** de qué merece cobertura
  —y en tu caso es mucho, porque es todo código nuevo: actividad completa, sin GPS, sin
  pulso, con laps, tipo desconocido, multideporte, ida y vuelta del encoder, y sobre todo
  el formato de `start_date_local`. La pasada de cobertura se hace una sola vez sobre el
  resultado ya integrado de los cuatro frentes.
- **No modifiques `src/types/activity.ts` ni `src/lib/sports.ts`.**

---

## Verificación de cierre

```bash
npx tsc --noEmit
npm run lint
npx jest
npm run build
```

Piso heredado: **556 tests en 31 suites, todos verdes; lint 0 errores y 6 warnings
preexistentes; build limpio.** Los warnings no son tuyos.

Como no escribís tests y tu código no lo llama nadie todavía, la verificación sólo prueba
que compila y que no rompiste nada. **Decilo así en el feedback**, con esas palabras: un
"todo verde" que no distingue lo verificado de lo asumido no sirve para decidir.

Lo que sí podés y debés comprobar a mano: el ida y vuelta del encoder contra
`decodePolyline`, con la cadena del test que ya existe. Un `node -e` o un script temporal
alcanza — **borralo antes de cerrar**.

---

## Feedback

Dejá `docs/feedback-frente-c.md`, **escrito a medida que avanzás, no al final**:

- Decisiones donde el plan dejaba margen: el fallback del tipo desconocido, el `name`
  cuando falta, `moving_time` cuando no hay samples.
- Desvíos, explicados.
- Todo campo de Garmin donde la documentación que encontraste **no coincida** con la de
  este plan, con la fuente. El plan se escribió contra documentación pública y de terceros
  porque la oficial exige cuenta aprobada: si encontraste algo mejor, es información
  valiosa.
- Deuda preexistente vista al pasar, con archivo y línea. No la arregles.
- **Inventario de qué merece test**, que en tu frente es el entregable más importante
  después del código.
- La salida real de la verificación, con la aclaración de qué prueba y qué no.
