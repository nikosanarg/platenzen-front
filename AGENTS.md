<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — platenzen-front

Dashboard personal de estadísticas de Strava (platenzen.com): conectás tu cuenta y el
sistema procesa tu historial completo de actividades para mostrar métricas, récords,
patrones y un sistema de progresión gamificado. Next.js 16 App Router + React 19 +
TypeScript + styled-components.

## Harness de ingeniería

Antes de trabajar, leé en este orden:

1. `../kaizen-harness/dev-workflow.md` — invariantes de trabajo y routing por tipo de tarea.
2. `./project-profile.md` — stack, comandos y zonas sensibles de este repo.

Cargá **sólo** las responsabilidades (`../kaizen-harness/responsibilities/*.md`) que el
routing indique. Todo cambio visible carga además `interface.md`.

**Si el harness no está disponible** —la ruta no existe o no tenés acceso— no lo busques ni
lo reconstruyas. Seguí `project-profile.md` y las buenas prácticas estándar de la
industria: entender antes de modificar, alcance mínimo, reutilizar antes de crear,
respetar la arquitectura existente, y verificar con lint y build antes de dar algo por
terminado.

## Reglas de este repo

1. **Los números son la promesa del producto.** Niveles, XP, récords proyectados,
   predicciones y porcentajes de consistencia salen de datos reales del usuario. Un cálculo
   mal hecho no es un bug visual: le miente al corredor sobre su progreso. Todo cambio de
   fórmula lleva verificación con datos concretos.
2. **El tono es factual, sin lenguaje motivacional.** "Estado actual" muestra
   observaciones breves y objetivas. No agregar arengas ni signos de exclamación.
3. **No hay sistema de recompensas ni de "permisos".** Existió uno —niveles con premios de
   comida, tiers, categorías secretas— y se eliminó por decisión del PO: el producto mide
   lo que la persona corrió, no la premia. Si aparece un pedido de gamificación, se plantea
   antes de construirlo; no se reintroduce por analogía con lo que había.
4. Los tokens de Strava son credenciales de terceros: van por las rutas de
   `src/app/api/strava/*`, nunca al cliente ni al repo. **El refresh token vive sólo en la
   cookie `httpOnly` `strava_refresh`**, que el servidor escribe, lee y rota; el cliente
   nunca lo ve. El access token sí puede estar en `localStorage`: dura 6 horas y se
   renueva. Si algo te empuja a devolver el refresh token en una respuesta, es la señal de
   que estás por deshacer el arreglo, no de que falte un caso.
5. Respetar los límites de la API de Strava. El historial completo se procesa una vez, no
   en cada render.
6. `npm run build` tiene que pasar limpio antes de considerar terminada cualquier tarea.

## Varias fuentes de actividades

Platenzen lee actividades de más de un proveedor. La regla que ordena todo lo demás:
**los proveedores son un detalle de integración; el dominio trabaja con una sola
estructura.** Un adapter traduce hacia adentro, y ni la UI ni los cálculos saben de dónde
vino el dato.

- **El contrato canónico es `src/types/activity.ts`.** Su vocabulario (`distance` en
  metros, `moving_time` en segundos, `average_speed` en m/s) es el que el dominio ya
  hablaba cuando Strava era el único proveedor. No se renombra: `moving_time` no es peor
  que `movingTimeSeconds`, sólo distinto, y cambiarlo cuesta 30 archivos a cambio de nada.
- **La identidad de una actividad es `provider + externalId`, nunca `id`.** Dos proveedores
  pueden emitir el mismo número. `mergeActivities` deduplica por ese par, y por eso
  sincronizar dos veces es seguro. Un `Activity` sólo se construye desde un adapter
  (`src/services/providers/*`): sin esa vía obligada se cuela una actividad sin origen y la
  deduplicación deja de ser confiable justo cuando hay dos proveedores conectados.
- **`start_date_local` lleva sufijo `Z` pero es hora local de pared.** Una salida de las
  18:13 en Buenos Aires es `2026-05-25T18:13:24Z`. No es un error heredado: el dominio la
  lee cortando el string (`stats.ts`) y con `new Date()` (`utils/grouping.ts`), y las dos
  formas dan la hora correcta sólo gracias a esa mentira. Un adapter que emita el offset
  real (`-03:00`) corre las actividades tres horas en el mapa de calor y en la distribución
  horaria, en silencio y sólo para ese proveedor.
- **El vocabulario de deportes vive en `src/lib/sports.ts` y en ningún otro lado.** Estuvo
  copiado en 21 archivos, donde que todos coincidieran era suerte y no diseño. Es el
  vocabulario de Strava a propósito, y los demás proveedores traducen hacia él.
- **Un dato que el proveedor no mandó queda `undefined`, nunca en 0.** Garmin omite el
  campo cuando el dispositivo no lo midió. Un `0` de relleno entra a los promedios como si
  fuera un pulso real; un `undefined` es la verdad.
- **El GPS entra como polyline codificada.** Si un proveedor entrega coordenadas sueltas,
  el adapter las codifica (`src/lib/polylineEncoder.ts`). Los cinco consumidores de
  `map.summary_polyline` no aprenden un segundo formato.
- **Al contrato canónico no se le agrega lo que el producto no usa.** Cadencia, calorías,
  laps y streams existen en los dos proveedores y quedan afuera hasta que algo los muestre.
  Están inventariados en `docs/matriz-proveedores.md`.
- **Garmin está escrito pero no conectado, y no es un olvido.** Su programa de
  desarrolladores es sólo para empresas y con aprobación, y entrega por push a una callback
  pública que necesita un backend con persistencia que Platenzen no tiene. El mapper y la
  matriz están; el resto no se puede hacer todavía. Ver `docs/matriz-proveedores.md`.

## PWA

Es una capa de distribución del frontend, no una excusa para mover credenciales al cliente
ni para volver la app offline-first.

- **El service worker no intercepta `/api`. Nunca.** Es la primera guarda de su handler de
  `fetch`. Ahí viven el intercambio y el refresco de credenciales de Strava, y una
  respuesta de esas servida desde caché es un token viejo aplicado a una sesión nueva.
- Tampoco toca nada que no sea `GET`, y no hay cola de escrituras ni Background Sync.
- Las navegaciones van **a la red primero**, no stale-while-revalidate: con SWR el
  dashboard mostraría los números de la sesión anterior como si fueran los de ahora, y eso
  choca de frente con la regla 1. El offline de datos ya está resuelto en otra capa
  (`localStorage`, `src/lib/cache.ts`); el worker sólo cachea el shell y los assets.
- El registro corre **sólo en producción y sobre contexto seguro**: en `next dev` un
  service worker sirve chunks de una compilación anterior y se pierde una tarde buscando el
  bug donde no está. Corolario práctico: **el botón de instalar no aparece en `npm run
  dev`**, y no está roto — el navegador no emite `beforeinstallprompt` sin manifiesto y
  service worker activos.
- **El estado de instalación tiene un solo dueño: `pwa/useInstalacionPWA`.**
  `beforeinstallprompt` llega **una única vez**; si dos componentes lo escucharan por su
  cuenta, el segundo no vería nada. De ahí sale la coordinación: cada pantalla que ofrece la
  instalación embebida registra un anclaje, y el botón flotante —que es el respaldo— se
  esconde mientras haya alguno. Si agregás un tercer lugar donde ofrecerla, usá
  `useBotonInstalacionInline` y esa regla se cumple sola.

## Proveedores en la pantalla de conexión

Se muestran **todos** los proveedores que Platenzen sabe leer, incluso los que todavía no se
pueden conectar. Una opción visible y apagada comunica de qué es capaz el producto; una
ausencia no comunica nada. Lo que no se hace es fingir que funciona: el motivo del bloqueo
va en **texto visible**, no en un tooltip que hay que descubrir.

Un botón bloqueado se marca con **`aria-disabled`, nunca con el `disabled` nativo**: un
botón realmente deshabilitado no recibe foco ni puntero, así que quien navega con teclado o
lector de pantalla nunca llegaría a la explicación — que es justamente lo único que hay para
comunicar. El guard del click vive adentro del componente, no en quien lo usa.
