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

## Pasada 1 (tipo) — en curso

(se completa abajo a medida que avanza)

## Pasada 2 (vocabulario deportes) — pendiente

## Desvíos

## Deuda preexistente vista al pasar

## Pendiente de integración (territorio ajeno)

## Inventario de qué merece test

## Verificación de cierre
