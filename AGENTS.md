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
3. Las dos categorías secretas de logros sólo se revelan cuando el usuario está cerca de
   alcanzarlas. No exponerlas en listados, respuestas de API ni código de cliente
   accesible.
4. Los tokens de Strava son credenciales de terceros: van por las rutas de
   `src/app/api/strava/*`, nunca al cliente ni al repo.
5. Respetar los límites de la API de Strava. El historial completo se procesa una vez, no
   en cada render.
6. `npm run build` tiene que pasar limpio antes de considerar terminada cualquier tarea.
