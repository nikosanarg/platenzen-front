# El club: ranking por ligas y fichas públicas

Platenzen funciona sin el club: el historial se procesa y se guarda en el dispositivo. El
club es opcional y suma un ranking público y una ficha que otros pueden ver. Lo sostiene
`platenzen-api` (repo hermano), cuyo único cliente es el servidor de este front.

## Cómo viaja la identidad

```
navegador ── access token de Strava ──► POST /api/club/sesion
                                          │ GET /athlete (una sola vez)
                                          │ identidad = HMAC(PLATENZEN_IDENTIDAD_SECRET, "strava:<id>")
                                          └ cookie httpOnly pz_club (firmada, 30 días, path /api/club)

navegador ──► /api/club/<ruta> ──► platenzen-api
               lee pz_club          X-Platenzen-Secret + X-Corredor-Identidad
```

- La API nunca ve el id de atleta, ni el token, ni nada de la cuenta de Strava.
- La identidad sale de la cookie, nunca de una cabecera que mande el navegador.
- El proxy (`src/app/api/club/[...ruta]/route.ts`) sólo deja pasar las rutas que el front
  usa. No es un túnel.
- Desconectar Strava (`/api/strava/disconnect`) también borra `pz_club`.
- En modo mock, la identidad es la de un atleta fijo (`mock`). Nunca en producción.

## Qué se publica

`src/lib/club/publicacion.ts`, cada vez que termina de cargar el historial y el corredor
está registrado y tiene los acuerdos al día:

- **La ficha** (`HeroProfile`) en su versión publicable: las salidas destacadas llevan
  una etiqueta derivada del deporte ("Carrera", "Trail", "Otra actividad"), no el nombre
  que el corredor les puso. Sin nombre de persona: lo pone la API.
- **Running por día** de los últimos 90 días: km, salidas, y km y segundos de las salidas
  con ritmo medido.
- **Semanas activas** (por su lunes) de los últimos tres años, con cualquier deporte.

La API guarda agregados por día y calcula la ventana al consultar: el dato vence aunque el
corredor no vuelva a abrir la app.

## Decisiones del PO

- **El ranking siempre mide los últimos 90 días.** Es normal que el dato "venza".
- **Ponderar por recencia queda como opción**, no implementada: que lo reciente valga más y
  lo que está por vencer casi no pese. Si se hace, una forma simple es
  `peso(d) = 0.5 ^ (d / 45)` sobre distancia y salidas, nunca sobre el ritmo, y la columna
  tiene que decir que está ponderada.
- **Ligas por racha semanal actual**, con cualquier deporte: bronce < 4 semanas, plata de
  4 a 11, oro desde 12. La semana en curso no corta la racha mientras no termine.
- **El ranking mide sólo running**: distancia (default), ritmo y salidas. Cada liga se
  ordena por separado.
- **Identidad vía Strava**, a través del servidor de Platenzen. El corredor no crea otra
  cuenta.
- **El ranking es público**, y cada corredor elige su privacidad: `publica` (ranking y
  ficha), `solo_ranking` (aparece la fila, la ficha no se abre) u `oculta`.
- **Nombre**: el que el corredor elige (único en el club, sin distinguir mayúsculas), o un
  alias de fantasía que se asigna al registrarse ("pepino357619": una palabra sencilla y
  seis dígitos). País opcional.
- **@usuario**: opcional, va en la URL de la ficha (`/hero/<usuario>`). Minúsculas, único,
  y no puede tener la forma de un alias ni ser una ruta. Sin usuario, la URL usa el alias.
- **Nada sensible ni directo de Strava**: todo lo publicado es derivado, calculado o
  saneado.

## Pantallas

| Ruta | Qué es |
|---|---|
| `/ranking` | La tabla del club. Sin el club disponible, muestra sólo la fila propia calculada en el dispositivo |
| `/profile` | Alta (con aceptación de acuerdos) para quien no está; usuario, nombre, país, privacidad y baja para quien sí |
| `/hero` | La ficha propia tal como la ve otra persona, con el link público |
| `/hero/[clave]` | La ficha pública de un corredor, por su @usuario (`/hero/nsande`); su alias o su id también sirven. Fuera del login: es el link que se comparte |

`/mapa` y `/perfil` redirigen a `/map` y `/profile` (`next.config.ts`): las rutas pasaron a
inglés y las viejas pueden estar en marcadores o en la PWA instalada.
| `/acuerdos` | Los acuerdos del club. Fuera del login: se leen antes de aceptar |

## Lo que tiene que seguir coincidiendo con platenzen-api

| Front | API |
|---|---|
| `src/lib/ranking.ts`, `computeWeeklyStreak` | `src/domain/ranking/ranking.ts` |
| `src/lib/paises.ts` | `src/domain/corredor/paises.ts` |
| `src/lib/club/acuerdos.ts` (y el texto de `/acuerdos`) | `src/domain/corredor/acuerdos.ts` |

## Corredores de ejemplo

`scripts/club-ejemplo.ts` siembra 13 corredores inventados, repartidos en las tres ligas
y con las tres visibilidades. Sus actividades son falsas pero pasan por el adapter de
Strava y por `construirPublicacion`, y entran a la API como cualquier corredor:

```bash
npx tsx --env-file=.env.local scripts/club-ejemplo.ts           # sembrar o resembrar
npx tsx --env-file=.env.local scripts/club-ejemplo.ts --borrar  # quitarlos
```

Usa `PLATENZEN_API_URL` y `PLATENZEN_SERVER_SECRET`: escribe en la base a la que apunte esa
API. Sus identidades son `sha256("platenzen-ejemplo:<clave>")`, así que `--borrar` no puede
tocar a un corredor real.

## Límite conocido

Los números los calcula el navegador de cada corredor. La API comprueba que sean
posibles (ritmos, kilómetros por día, fechas), no que sean ciertos: alguien decidido a
inflar sus números con cuidado puede hacerlo. Los acuerdos lo prohíben y permiten sacarlo
del ranking; no hay una barrera técnica.
