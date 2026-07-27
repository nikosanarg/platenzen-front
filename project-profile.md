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
src/app/api/strava/callback/   OAuth de Strava
src/app/api/strava/refresh/    refresco de token
src/                           páginas y componentes
```

El acceso a Strava pasa siempre por las rutas de servidor. No hay backend propio más allá
de eso.

---

## Comandos

| Propósito | Comando |
|---|---|
| Lint | `npm run lint` |
| Build | `npm run build` |
| Tests | no hay suite configurada |
| Suite de verificación antes de cerrar | `npm run lint && npm run build` |
| Levantar local | `npm run dev` |

Requiere credenciales de la API de Strava en variables de entorno.

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
- **Las dos categorías secretas de logros** sólo se revelan cuando el usuario está cerca.
  No exponerlas en listados, respuestas de API ni código de cliente inspeccionable.
- Tokens de Strava: credenciales de terceros. Nunca al repo ni al cliente.
- Límites de la API de Strava: el historial completo se procesa una vez, no en cada render.

---

## Interfaz

- Componentes propios con styled-components 6 (SSR registry configurado).
- Gráficos con Recharts.
- Tono factual, sin lenguaje motivacional.

## Tests

No hay framework de testing configurado. Dado que el producto es esencialmente cálculo
sobre datos, una suite para las fórmulas tendría alto valor — pero introducirla es una
decisión previa, no algo a colar en otra tarea.

## Control de versiones

Sin reglas propias declaradas. Aplica `commit.md` del harness.

---

## Responsabilidades que no aplican

- `database` — no hay base propia; los datos vienen de Strava.
