# Matriz de proveedores — Strava ↔ Garmin

Documento de referencia del adapter de Garmin (`src/services/providers/garmin/`).
Cubre cómo se llena cada campo de `Activity` (`src/types/activity.ts`) desde cada
proveedor, qué ofrece Garmin que Platenzen todavía no muestra, y qué falta para que
el proveedor funcione de verdad. No es documentación de usuario: es el mapa que
necesita quien retome este trabajo.

Contexto que no se repite en cada sección: **el adapter de Garmin de esta tanda no
está enchufado a la app.** Es una función pura de payload a `Activity`, probada a
mano. Ver el primer bloque de `docs/plan-frente-c-garmin.md` y la sección 3 más
abajo para el porqué.

---

## 1. Campo por campo: Platenzen ↔ Strava ↔ Garmin

| Campo de `Activity` | Strava | Garmin | Tratamiento |
|---|---|---|---|
| `provider` | — (implícito) | — (implícito) | Constante puesta por el adapter (`'strava'` / `'garmin'`), no viene del payload. |
| `externalId` | `id` (numérico → string) | `summaryId` | Mapeo directo, con conversión de tipo del lado de Strava. |
| `id` | `id` | `activityId ?? 0` | Mapeo directo. **No es identidad** (ver el comentario en `activity.ts`): Garmin a veces no manda `activityId`, y ahí va `0` de relleno — nunca un hash inventado. |
| `name` | `name` | `activityName`, con fallback | Directo en Strava. En Garmin, si falta (pasa con actividades autosincronizadas), el adapter deriva una etiqueta en español desde `sport_type` — decisión propia de este frente, no del contrato canónico. Ver `docs/feedback-frente-c.md`. |
| `type` / `sport_type` | directos | `activityType` traducido | Derivación con tabla: `sportTypes.ts` en Garmin, directo en Strava. |
| `distance` | `distance` | `distanceInMeters ?? 0` | Directo, con default a 0 cuando Garmin no midió distancia (ej. una sesión de pesas). |
| `moving_time` | `moving_time` | último sample `movingDurationInSeconds`, si no `durationInSeconds` | Directo en Strava. En Garmin es una **aproximación**: sin `details` (samples), no hay forma de distinguir tiempo en movimiento de tiempo total, y se usa la duración completa. |
| `elapsed_time` | `elapsed_time` | `durationInSeconds` | Mapeo directo en los dos. |
| `total_elevation_gain` | `total_elevation_gain` | `totalElevationGainInMeters ?? 0` | Directo. |
| `start_date` | `start_date` | `startTimeInSeconds` → ISO, sin offset | Directo en los dos, con la salvedad de que Garmin manda epoch en **segundos**, no un string ISO ya armado. |
| `start_date_local` | `start_date_local` (viene así de Strava) | `startTimeInSeconds + startTimeOffsetInSeconds` → ISO con `Z` falso | **El campo más delicado del contrato.** Los dos proveedores tienen que producir la misma mentira deliberada (hora local con sufijo `Z`) para que `stats.ts` y `grouping.ts` la lean bien sin saber de qué proveedor vino. Ver el comentario extenso en `activity.ts` y en `adapter.ts`. |
| `average_speed` | `average_speed` | `averageSpeedInMetersPerSecond`, si no `distance / elapsed_time` | Directo en Strava. Garmin a veces no manda la velocidad promedio (dispositivos viejos o actividades manuales); el adapter la deriva. **Nunca viene del proveedor el ritmo en sí** — `utils/pace.ts` lo calcula de `average_speed` para los dos proveedores por igual. |
| `max_speed` | `max_speed` | `maxSpeedInMetersPerSecond ?? 0` | Directo. |
| `average_heartrate` | `average_heartrate` (opcional) | `averageHeartRateInBeatsPerMinute` (opcional) | Directo en los dos, **sin inventar cero** cuando no vino. |
| `max_heartrate` | `max_heartrate` (opcional) | `maxHeartRateInBeatsPerMinute` (opcional) | Idem. |
| `map.summary_polyline` | `map.summary_polyline` (ya viene codificada) | `samples[].{latitudeInDegree,longitudeInDegree}` → `encodePolyline` | Directo en Strava. En Garmin es **derivación real**: Garmin manda coordenadas sueltas por muestra, el adapter las codifica con `src/lib/polylineEncoder.ts` para que el resto del dominio (`worldMap`, `explorationUtils`, `coachAnalisis`, `UltimaActividad`, `CoachAnalisis`) no tenga que aprender un segundo formato. Sin `details`, o sin samples con lat **y** lon, el campo queda ausente (no un objeto con `summary_polyline: undefined`). |
| `kudos_count` | `kudos_count` | — | **No existe del otro lado.** Garmin no tiene interacción social en su API de actividades. El adapter no pone el campo (queda `undefined`), no lo fuerza a 0. |
| `athlete_count` | `athlete_count` | — | Idem `kudos_count`. |

---

## 2. Lo que Garmin ofrece y Platenzen todavía no muestra

Para cada métrica: si Strava también la tiene (paridad) o si es exclusiva de Garmin
(mostrarla generaría un hueco cuando la actividad viene de Strava).

| Métrica de Garmin | Campo | ¿Strava también la tiene? | Nota |
|---|---|---|---|
| Cadencia de carrera | `averageRunCadenceInStepsPerMinute` | Sí (`average_cadence` en la API de Strava, no está en el `StravaActivity` actual de este repo) | Se podría mostrar con paridad entre proveedores, pero **hoy ninguno de los dos adapters la trae al contrato** — agregarla es trabajo en ambos lados, no sólo en Garmin. |
| Calorías activas | `activeKilocalories` | Sí (`calories` en la API de Strava, tampoco está tipada hoy en `StravaActivity`) | Mismo caso que cadencia: paridad posible, pero no está en el contrato canónico todavía. |
| Pasos | `steps` | No de forma directa en actividades (Strava lo tiene para el resumen diario del atleta, no por actividad) | Exclusiva de Garmin a nivel actividad. Mostrarla sólo para actividades de Garmin dejaría un hueco visible en las de Strava. |
| Potencia | `powerInWatts` (por sample) | Sí, Strava la tiene para ciclismo con medidor de potencia | Paridad posible para `Ride`. Es dato de **serie temporal** (por sample), no un resumen — requeriría procesar `details`, no sólo `summary`. |
| Temperatura del aire | `airTemperatureCelcius` (por sample) | Sí, Strava también expone temperatura por stream | Paridad posible. También es serie temporal, no resumen. |
| Laps | `GarminLap[]` (sólo `startTimeInSeconds` en este tipado) | Sí, Strava tiene splits/laps | Paridad posible, pero el tipo de Garmin que se armó acá es mínimo (sólo el inicio del lap); la documentación real probablemente trae más campos por lap (distancia, ritmo del split) que no se tipeó porque no se pudo confirmar contra el payload real. |
| Series por segundo (samples completos: elevación, velocidad, distancia acumulada) | `GarminSample` | Sí, Strava tiene streams equivalentes vía un endpoint separado (`/activities/{id}/streams`) que este repo tampoco consume hoy | Paridad conceptual, pero **ninguno de los dos proveedores** alimenta hoy una vista de streams en Platenzen — no es algo que Garmin traiga y Strava no, es una capacidad que el producto no usa todavía de ningún lado. |

**Lectura general:** casi todo lo que Garmin ofrece de más tiene un equivalente en la
API de Strava que este repo tampoco está usando hoy (`StravaActivity` en
`src/types/strava.ts` es un subconjunto deliberadamente chico). Mostrar cualquiera
de estas métricas es un trabajo de **dos proveedores**, no de uno: agregar sólo el
lado Garmin dejaría huecos en el dashboard según de dónde vino cada actividad, que
es exactamente el problema que este documento existe para anticipar.

---

## 3. Lo que falta para que Garmin funcione de verdad

Sin tono de disculpa: esto es el estado real, y sirve para decidir si vale la pena
seguir invirtiendo antes de tener acceso.

1. **Acceso al Garmin Connect Developer Program.** Es sólo para uso empresarial
   ("it is only for business use", FAQ oficial de Garmin) y requiere aprobación.
   Hay reportes de 2026 de que las solicitudes nuevas están pausadas sin fecha de
   reapertura. Sin esto, nada de lo demás importa.
2. **Un backend con persistencia.** Garmin no tiene un endpoint de "traeme mis
   actividades": entrega por **push** a una callback URL pública, o por **ping +
   pull** contra una URL que Garmin manda. Los dos modelos exigen un servidor que
   reciba avisos cuando el usuario no está con la página abierta. Platenzen hoy
   sólo tiene `src/app/api/strava/*`, que son proxies sin estado — no hay dónde
   guardar un webhook entrante ni una cola de actividades pendientes de pull.
3. **El flujo OAuth 2.0 con PKCE de Garmin**, que es un protocolo propio (no es el
   mismo flujo que Strava) y no se escribió en esta tanda a propósito: un botón
   "Conectar Garmin" que no puede completar el flujo es peor que no tener botón.
4. **El backfill inicial.** Cuando un usuario conecta la cuenta, Garmin no manda
   automáticamente el historial completo — hay un endpoint de backfill aparte que
   hay que invocar explícitamente y que también entrega por callback, no por
   respuesta directa. Sin esto, un usuario nuevo de Garmin arrancaría con el
   dashboard vacío hasta su próxima sincronización.

Ninguno de estos cuatro puntos es "difícil" en el sentido de requerir una decisión
de diseño: son bloqueos de acceso e infraestructura que no dependen de este
adapter. El adapter (`toActivity`, `esActividadContenedora`, `sportTypeDeGarmin`,
`encodePolyline`) es el único de los cuatro que ya está resuelto.
