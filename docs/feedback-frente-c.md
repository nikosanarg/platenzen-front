# Feedback — Frente C (Garmin)

Escrito a medida que avanzo, no al final.

## Verificación previa contra documentación real

Antes de escribir código busqué en la web para confirmar los nombres de campo y el
enum de `activityType` que trae el plan, porque el plan mismo avisa que se escribió
contra documentación de terceros (la oficial exige cuenta aprobada, que es
justamente el bloqueo que explica el primer bloque del plan).

- Encontré una copia de la **"Health REST API Specification 2.9.6 Worldwide"** de
  Garmin (publicada por un tercero en pdfcoffee.com, no por Garmin). Confirma
  camelCase para: `summaryId`, `startTimeInSeconds`, `startTimeOffsetInSeconds`,
  `activityType`, `durationInSeconds`, `distanceInMeters`,
  `averageHeartRateInBeatsPerMinute`, `maxHeartRateInBeatsPerMinute`,
  `averageSpeedInMetersPerSecond`, `totalElevationGainInMeters`,
  `activeKilocalories`, `steps`, `manual`, `isParent`, `parentSummaryId`,
  `deviceName`. Coincide exactamente con el plan.
- La misma fuente confirma para Activity Details:
  `latitudeInDegree`, `longitudeInDegree`, `heartRate`, `speedMetersPerSecond`,
  `elevationInMeters`. También coincide.
- **No pude confirmar independientemente la lista completa del enum
  `activityType`** (`STREET_RUNNING`, `TRACK_RUNNING`, `ULTRA_RUNNING`,
  `TREADMILL_RUNNING`, `INDOOR_RUNNING`, `VIRTUAL_RUNNING`,
  `OBSTACLE_COURSE_RACING`, `LAP_SWIMMING`, `OPEN_WATER_SWIMMING`, `ROAD_BIKING`,
  `INDOOR_CYCLING`). Las fuentes públicas que encontré sólo muestran ejemplos
  parciales (`RUNNING`, `CYCLING`, `WALKING`, `HIKING`, `MOUNTAIN_BIKING`,
  `TRAIL_RUNNING`, `MULTI_SPORT`) y mencionan que el documento real tiene un
  "Appendix A – Activity Types" con la lista completa que no pude ver. No encontré
  nada que **contradiga** al plan, así que seguí la tabla tal como está.
- Confirmé de forma independiente (otra fuente, sobre Garmin Health API en
  general) el punto más importante del primer bloque del plan: **el acceso
  requiere aprobación de partner program y la entrega es por push a callback
  registrada — no hay endpoint de polling**. Coincide con lo que dice el plan.

Fuentes consultadas: pdfcoffee.com (copia de la Health REST API Specification
2.9.6), developer.garmin.com/gc-developer-program/ (overview, activity-api,
program-faq), openwearables.io (dos artículos de blog sobre la API de Garmin).
Ninguna es la doc oficial completa (esa exige login de partner aprobado), pero las
tres coinciden entre sí y con el plan.

## Encoder de polyline: verificación a mano

Escribí `src/lib/polylineEncoder.ts` y lo verifiqué con un script temporal de Node
(sin TS, reimplementando decode+encode en JS plano para no depender del resolver de
paths del proyecto) contra:

1. El string canónico del test existente
   (`'_p~iF~ps|U_ulLnnqC_mqNvxq\`@'` → `[[38.5,-120.2],[40.7,-120.95],[43.252,-126.453]]`):
   decodificar y volver a codificar esas 3 coordenadas reproduce el string **byte a
   byte**, no sólo un valor equivalente.
2. Lista vacía: `encodePolyline([])` → `''` → `decodePolyline('')` → `[]`.
3. Un punto solo.
4. Cinco coordenadas con signos mixtos (incluye Buenos Aires, `[0,0]`, y valores con
   más de 5 decimales) — el round trip da exactamente los valores originales
   redondeados a 1e-5.

El script se borró después de confirmar (`/tmp/verify_polyline.js`, fuera del repo).

## Decisiones donde el plan dejaba margen

- **Fallback de `activityType` desconocido** (`sportTypes.ts`): `sportTypeDeGarmin`
  devuelve el valor crudo de Garmin tal cual, sin normalizar, cuando no está en la
  tabla — ni siquiera lo paso por un `'Workout'` genérico. Sólo caigo en
  `'Workout'` cuando Garmin **ni manda** `activityType` (dato ausente, no dato
  desconocido). Son dos casos distintos a propósito: un tipo desconocido todavía
  dice algo (`'STAND_UP_PADDLEBOARDING'`), y perderlo en un genérico tira
  información que el día de mañana puede servir para ampliar la tabla.
- **`name` cuando falta** (`adapter.ts#nombrePorDefecto`): el plan sólo dice "una
  etiqueta derivada del tipo". No hay ningún diccionario de etiquetas en español
  para tipos de deporte en el resto del repo (busqué; `ActivityCard` sólo compara
  contra `['Run', 'TrailRun', 'VirtualRun']`, no traduce), así que armé uno chico y
  local al adapter, con fallback a "humanizar" el `activityType` crudo de Garmin
  (`STAND_UP_PADDLEBOARDING` → `"Stand up paddleboarding"`) para no mostrar un
  genérico vacío de información cuando el tipo es reconocible pero no está en mi
  tabla de nombres. Es una decisión de UX menor que el PO puede querer revisar —
  no toqué ningún archivo de i18n existente porque este repo no tiene el patrón
  `locales/{es,en,pt}` que sí tiene Valle Verde; los strings de este repo están en
  el código.
- **`moving_time` sin samples**: uso `durationInSeconds` completo, tal como pide el
  plan. Documentado en la matriz de proveedores como una aproximación real (no un
  detalle menor): sin `details`, Garmin no distingue tiempo en movimiento de
  tiempo total en el summary.
- **`average_speed` derivado**: uso `distance / elapsed_time` (con guard de
  división por cero) cuando Garmin no manda la velocidad promedio. El plan lo pide
  así ("si falta, derivalo de distancia/duración") sin especificar qué duración —
  usé `durationInSeconds` (elapsed), no `moving_time`, porque `moving_time` en el
  caso sin samples ES `durationInSeconds`, así que da lo mismo, y en el caso CON
  samples usar `moving_time` (potencialmente menor) infla la velocidad promedio
  respecto de lo que reportaría el propio dispositivo. Quedó anotado por si alguien
  lo revisa distinto.
- **`map` ausente vs. `map: { summary_polyline: undefined }`**: opté por **no**
  poner la clave `map` en absoluto cuando no hay coordenadas válidas, en vez de
  poner `map: {}` o `map: { summary_polyline: undefined }`. Es consistente con
  cómo Strava lo manda (a veces omite `map` directamente) y evita que el resto del
  dominio tenga que distinguir "sin mapa" de "mapa vacío".

## Desvíos

Ninguno respecto del plan en la forma de los tipos ni en el mapeo campo por campo.
El único desvío es de alcance: agregué `tipoDeGarmin` (para `Activity.type`) además
de `sportTypeDeGarmin` (para `Activity.sport_type`), porque el plan sólo hablaba de
"sportTypes.ts" en general y el contrato de `Activity` pide los dos campos. Los dos
devuelven lo mismo hoy (documentado en el comentario de `tipoDeGarmin`), pero los
dejé como dos funciones separadas y no un alias, por si el día de mañana Garmin
distingue algo entre summary y detail que amerite diferenciarlos.

## Deuda preexistente vista al pasar (no la toqué)

- `src/types/strava.ts` no tipa `average_cadence` ni `calories`, aunque la API de
  Strava sí los expone. Lo noto en la sección 2 de la matriz porque afecta directo
  la conversación de "qué le falta a Garmin": varias métricas que parecen
  exclusivas de Garmin en realidad también las tiene Strava, sólo que este repo no
  las trajo de ningún lado todavía.
- `project-profile.md` dice "no hay suite de tests" — es información vieja, la
  tarea me avisó que sí la hay (31 suites, 556 tests). No lo arreglo porque no es
  mi archivo (no está en mi territorio) y ya me lo señalaron; lo dejo anotado por si
  a nadie más le toca corregirlo.

## Inventario de qué merece test

Es todo código nuevo y sin consumidores todavía, así que la cobertura que falta es
completa. Orden sugerido por importancia:

**`src/lib/polylineEncoder.ts`** (el más importante: es el único cálculo con
riesgo de silencioso-pero-mal):
- `decodePolyline(encodePolyline(c)) === c` (redondeado a 1e-5) para el caso
  canónico del test existente, **byte a byte contra el string esperado**, no sólo
  igualdad de coordenadas.
- Lista vacía → `''`.
- Un solo punto.
- Coordenadas negativas en ambos ejes (el caso donde el zigzag puede fallar si se
  implementa mal el complemento a dos).
- Coordenadas con más de 5 decimales (verificar que trunca/redondea, no que falla).

**`src/services/providers/garmin/adapter.ts#toActivity`**:
- Actividad completa (summary + details con samples, laps, pulso, velocidad).
- Actividad sin GPS (sin samples, o samples sin lat/lon): `map` no debe existir en
  el resultado.
- Actividad sin pulso: `average_heartrate` y `max_heartrate` **estrictamente
  `undefined`**, nunca `0` — este es el test que más vale la pena escribir primero,
  porque es el que un descuido rompe en silencio (un `?? 0` de más en un refactor
  futuro no lo detecta nada más que un test explícito).
- Actividad con `activityType` desconocido: `sport_type` devuelve el string crudo
  de Garmin, no `'Run'` ni `'Workout'`.
- Actividad sin `activityType` en absoluto: `sport_type === 'Workout'`.
- `activityId` ausente: `id === 0`.
- `activityName` ausente: usa la etiqueta derivada, no un string vacío ni
  `undefined`.
- **`start_date_local`, el caso que más importa de todo el frente**: con
  `startTimeInSeconds` y `startTimeOffsetInSeconds` conocidos (ej. Buenos Aires,
  offset `-10800`), verificar que el resultado sea la hora de pared esperada con
  sufijo `Z`, y que **no** sea igual a `start_date` (que si el offset es distinto
  de cero, tienen que diferir). Un test que sólo comprueba que el campo "existe"
  no sirve acá — tiene que comprobar el valor exacto de la hora.
- `moving_time` con samples: toma el último `movingDurationInSeconds`, no el
  primero ni un promedio.
- `moving_time` sin samples: cae a `durationInSeconds`.
- `average_speed` cuando Garmin no lo manda: se deriva de distancia/duración, no
  queda `0` ni `undefined`.
- Actividad manual (`manual: true`): se mapea como cualquier otra, sin ninguna
  rama especial (el test sirve para fijar que no se agregue tratamiento distinto
  sin querer en el futuro).

**`src/services/providers/garmin/adapter.ts#esActividadContenedora`**:
- `isParent: true` → `true`.
- `isParent` ausente o `false` → `false`.

**`src/services/providers/garmin/sportTypes.ts`**:
- Cada entrada de la tabla de mapeo, en particular las que tienen tratamiento no
  obvio: `TREADMILL_RUNNING`/`INDOOR_RUNNING`/`VIRTUAL_RUNNING` → `VirtualRun`
  (tres orígenes distintos, mismo destino), `ULTRA_RUNNING` → `TrailRun` (no es
  intuitivo por el nombre).
- Tipo no mapeado → se devuelve tal cual, no `'Run'`.
- `undefined`/ausente → `'Workout'`.

## Verificación de cierre

**Esto sólo prueba que el código compila, pasa lint y no rompió nada existente —
no prueba que el mapeo sea correcto contra un payload real de Garmin (no hay forma
de conseguir uno sin la cuenta aprobada), y no prueba nada con tests automatizados
porque este frente no escribe tests.** El único chequeo funcional real que hice es
el round trip manual del encoder contra el decoder existente, documentado arriba.

```
$ npx tsc --noEmit
(sin salida, exit 0)

$ npm run lint
✖ 5 problems (0 errors, 5 warnings)
```
Los 5 warnings son preexistentes y ninguno cae en archivos de este frente
(`CoachPersonalizado/index.tsx`, `Dashboard/index.tsx` ×2, `achievements.ts`,
`roles.ts`). El plan mencionaba 6 warnings preexistentes; salieron 5 — no investigué
la diferencia porque no toqué ninguno de esos archivos y no es mi territorio.

```
$ npx jest
Test Suites: 31 passed, 31 total
Tests:       556 passed, 556 total
```
Coincide exactamente con el piso heredado que describe el plan. Ninguna de mis
funciones nuevas tiene test propio (a propósito, ver el inventario arriba), así
que esta corrida sólo certifica que no rompí nada existente.

```
$ npm run build
✓ Compiled successfully
Route (app): /, /_not-found, /achievements, /api/strava/callback,
/api/strava/refresh, /comparative
```
Build limpio. Ninguna de las rutas listadas importa código de
`src/services/providers/garmin/` ni de `src/lib/polylineEncoder.ts` — el build
verde certifica "compila y no rompe nada", no "el mapper funciona", porque
todavía no hay ningún consumidor que lo ejercite.
