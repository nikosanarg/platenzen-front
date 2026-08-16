# Tanda "múltiples proveedores + PWA" — el reparto

Índice y criterio de la división en frentes paralelos. Los planes de cada frente y sus
feedbacks son documentos de trabajo y se borran al cerrar la tanda; **esto queda**.

| Frente | Rama | Plan | Qué resuelve |
|---|---|---|---|
| A | `frente/a-sesion-strava` | [plan-frente-a-sesion-strava.md](plan-frente-a-sesion-strava.md) | La sesión de Strava deja de perderse al cerrar la pestaña |
| B | `frente/b-modelo-canonico` | [plan-frente-b-modelo-canonico.md](plan-frente-b-modelo-canonico.md) | El dominio deja de hablar Strava: contrato canónico + adapters |
| C | `frente/c-garmin` | [plan-frente-c-garmin.md](plan-frente-c-garmin.md) | El mapper de Garmin y la matriz de equivalencias |
| D | `frente/d-pwa` | [plan-frente-d-pwa.md](plan-frente-d-pwa.md) | Platenzen se instala |

## Por qué estos cuatro y no otros

Se agrupó **por archivos que se tocan, no por tema**. C es tema de Garmin y B es tema de
proveedores, pero no comparten un solo archivo: B reescribe imports en ~65 archivos
existentes y C sólo crea archivos nuevos. Meterlos juntos habría serializado sin motivo el
frente más grande con el que más criterio necesita.

Lo que permitió separarlos fue **predeclarar los dos recursos compartidos como artefactos
reales antes de repartir** (commit `48cb35c`), en vez de describirlos en prosa en dos
planes y confiar en que convergieran:

- `src/types/activity.ts` — el contrato canónico `Activity`.
- `src/lib/sports.ts` — el vocabulario de deportes de carrera.

B los conecta al dominio; C produce contra ellos. Ninguno de los dos los modifica.

## Las decisiones que ya estaban tomadas al repartir

Se repiten en cada plan que las necesita, porque un frente que no las conoce las reabre:

- **El contrato canónico es el vocabulario que el dominio ya hablaba** (`distance`,
  `moving_time`, `average_speed`). No se "neutralizaron" los nombres: costaba 30 archivos y
  no le devolvía nada a nadie.
- **La identidad de una actividad es `provider + externalId`**, nunca `id`.
- **El vocabulario de deportes sigue siendo el de Strava** y los demás proveedores traducen
  hacia él.
- **El refresh token de Strava va a una cookie `httpOnly`**, no a `localStorage`. No hace
  falta base de datos y la promesa de privacidad que la UI hace en `TokenInput` se mantiene.
- **El GPS de Garmin se codifica a polyline en el adapter**, para que los cinco consumidores
  de `map.summary_polyline` no aprendan un segundo formato.
- **Garmin no se puede ejecutar en esta tanda**: el Connect Developer Program es sólo para
  empresas, con aprobación, y entrega por push a un backend con persistencia que Platenzen
  no tiene. Se escribe el mapper igual; el resto queda documentado en
  `docs/matriz-proveedores.md`.

## Cómo se cierra

Los frentes **no escriben tests de su propio código nuevo**: cada uno corre aislado y sólo
podría testear contra su suposición de cómo van a quedar los otros. Dejan **inventario** en
su feedback. La cobertura se escribe una sola vez, sobre el resultado ya integrado, en la
pasada de consolidación.

## Cerrada

Los cuatro frentes se integraron de a uno, verificando después de cada merge. La
consolidación sumó **74 tests** (556 → 630, 31 → 38 suites), priorizando las costuras entre
frentes — sobre todo `src/__tests__/providers/paridadProveedores.test.ts`, que comprueba que
la misma corrida entrando por Strava y por Garmin sea indistinguible para el dominio real.

Lo durable de los cuatro feedbacks quedó volcado en `AGENTS.md` (reglas de dominio),
`project-profile.md` (comandos, arquitectura y deuda conocida) y
`docs/revision-manual-pendiente.md` (lo que necesita un navegador y credenciales). Los
feedbacks se borraron, que es lo que corresponde a un documento de trabajo ya consumido.

Un hallazgo apareció en los **cuatro** feedbacks de forma independiente, sin que nadie los
coordinara: `project-profile.md` afirmaba que no había suite de tests cuando había 31
suites y 556 casos. Esa convergencia es evidencia de que importaba, no la opinión de una
sesión. Ya está corregido.
