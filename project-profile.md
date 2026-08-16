# Project Profile — platenzen-front

**PlatenZen** (platenzen.com), dashboard personal de estadísticas de Strava para el club de
running del mismo nombre.

El usuario conecta su cuenta de Strava y el sistema procesa su historial completo de
actividades para traducir datos crudos en decisiones concretas: nivel y XP acumulados,
logros ("Permisos") con temática de cultura argentina de running, misión activa con el
próximo logro alcanzable, predicciones a partir del promedio de las últimas 4 semanas,
récords proyectados para 5K/10K/21K, y un mapa de calor anual con racha y consistencia.

El tono del producto es deliberadamente factual: las observaciones de "Estado actual" son
breves y objetivas, sin lenguaje motivacional.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript.
- styled-components 6 con SSR registry.
- Recharts para visualizaciones.
- `@react-three/fiber` + `@react-three/drei` + `three` para 3D.
- `@xyflow/react` para diagramas de flujo.
- Deploy en Vercel.

## Arquitectura

```
src/app/api/strava/callback/     OAuth de Strava
src/app/api/strava/refresh/      refresco de token (lee la cookie httpOnly)
src/app/api/strava/disconnect/   cierre de sesión (borra las cookies)
src/services/providers/<x>/      un adapter por proveedor: payload crudo → Activity
src/types/activity.ts            el contrato canónico que consume todo el dominio
src/lib/                         cálculo: nivel, XP, logros, récords, predicciones
src/                             páginas y componentes
```

El acceso a Strava pasa siempre por las rutas de servidor. **No hay backend propio ni base
de datos**: los tokens viven en cookies del dispositivo y el historial de actividades en
`localStorage`. Es una restricción de producto, no una etapa pendiente — la pantalla de
conexión promete que nada se guarda en servidores.

La PWA (`public/sw.js` + `src/app/manifest.ts`) es una capa de distribución: **el service
worker nunca intercepta `/api`**, porque ahí viaja el OAuth.

---

## Comandos

| Propósito | Comando |
|---|---|
| Lint | `npm run lint` |
| Build | `npm run build` |
| Tests | `npx jest` (38 suites, 630 tests) |
| Cobertura | `npm run test:coverage` |
| Suite de verificación antes de cerrar | `npx tsc --noEmit && npm run lint && npx jest && npm run build` |
| Levantar local | `npm run dev` |

Requiere credenciales de la API de Strava en variables de entorno.

**`npm ci` falla**: el `package-lock.json` está desincronizado con `package.json` en
dependencias transitorias opcionales (`@emnapi/*`). Usá `npm install`. Regenerar el lock
es un cambio aparte, no algo a colar en otra tarea.

## Convenciones propias

- Toda interacción con Strava va por `src/app/api/strava/*`. Los tokens nunca llegan al
  cliente.
- Las visualizaciones usan Recharts. Antes de agregar otra librería de gráficos, verificá
  que Recharts no cubra el caso.

## Zonas sensibles

- **Los cálculos son la promesa del producto.** Nivel, XP, umbrales de logros, récords
  proyectados, predicciones y porcentaje de consistencia salen de datos reales. Una fórmula
  mal hecha le miente al corredor sobre su progreso. Todo cambio de fórmula lleva
  verificación con datos concretos, no sólo build verde.
- **Hay dos sistemas de nivel/XP y sobrevive uno solo**: `lib/xpSystem.ts`, el que alimenta
  la tarjeta de arriba de la Home. El alternativo (`lib/levels.ts`, `gamification.ts`,
  `milestones.ts`, `predictions.ts` y sus paneles) se eliminó. Si ves un "+N XP" en pantalla,
  verificá que salga de `xpSystem`: los de `milestones.ts` eran decorativos y no sumaban a
  nada, que fue el motivo de sacarlos.
- Tokens de Strava: credenciales de terceros. Nunca al repo ni al cliente.
- Límites de la API de Strava: el historial completo se procesa una vez, no en cada render.

## Deuda conocida (vista al pasar, no urgente)

- `package-lock.json` desincronizado: `npm ci` falla, hay que usar `npm install`.
- ESLint incluye `coverage/` en su análisis, así que un reporte generado agrega un warning
  fantasma. Debería ir a los ignores.
- Faltan íconos 192/512 con variante `maskable` para la PWA: hoy se declara el logo de
  412×411, que alcanza para instalar pero Android lo recorta contra su máscara circular.
  Necesita un asset de diseño, no código.
- `src/__mocks__/activitiesMock.ts` es un volcado real de la API de Strava sin ningún
  consumidor. Sirve como fixture realista si alguien la necesita; hoy es peso muerto.

---

## Interfaz

- Componentes propios con styled-components 6 (SSR registry configurado).
- Gráficos con Recharts.
- Tono factual, sin lenguaje motivacional.

## Tests

Jest + Testing Library, configurado en `jest.config.cjs`. Se corre con `npx jest`: **38
suites, 630 tests**. Los tests viven en `src/__tests__/`, agrupados por zona (`home/`,
`comparative/`, `achievements/`, `providers/`, `api/`, `shared/`), con una factory de
actividades en `helpers/activity.ts`.

El coverage se mide sólo sobre la capa de cálculo (`src/lib`, `src/utils`, `src/hooks`),
con un piso acordado de 90% de líneas y 80% de ramas. Es un piso, no una meta: no se
escriben tests para mover el número.

Las rutas de servidor (`src/__tests__/api/`) corren en entorno `node` vía docblock
`@jest-environment node`; `next/server` no funciona en jsdom.

**Lo que la suite no puede cubrir** y por lo tanto se verifica a mano: el flujo OAuth real
contra Strava, y todo lo que necesita un service worker vivo o un navegador (instalación de
la PWA, comportamiento sin conexión, ciclo de actualización).

## Control de versiones

Sin reglas propias declaradas. Aplica `commit.md` del harness.

---

## Responsabilidades que no aplican

- `database` — no hay base propia; los datos vienen de Strava.
