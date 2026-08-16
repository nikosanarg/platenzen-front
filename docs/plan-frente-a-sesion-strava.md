# Frente A — La sesión de Strava deja de perderse

**Worktree:** `c:\Users\Usuario\repos\platenzen-front-a`
**Rama:** `frente/a-sesion-strava`
**Modelo sugerido:** Sonnet

Trabajás solo, en un worktree aislado, sobre un repo que no viste antes. Este documento
tiene que alcanzarte: no hay conversación previa que consultar.

---

## El problema, con su causa raíz ya diagnosticada

El usuario de Platenzen tiene que volver a autorizar la app contra Strava una y otra vez.
La causa **no** es el refresco de tokens: eso ya está bien hecho
(`src/hooks/useToken.ts` rota el refresh token, deduplica llamadas concurrentes con un
`useRef`, y refresca 5 minutos antes de que expire el access token).

La causa es una sola línea:

```ts
// src/hooks/useToken.ts:4
const TOKEN_KEY = 'platenzen_strava_token';
// ...y más abajo, en readStored/writeStored:
sessionStorage.getItem(TOKEN_KEY)
```

**`sessionStorage` muere al cerrar la pestaña.** El refresh token se pierde junto con
ella, y sin refresh token la única salida es mandar al usuario de vuelta al flujo OAuth.

## Por qué no alcanza con cambiar `sessionStorage` por `localStorage`

Porque el refresh token de Strava es una credencial de larga vida — no expira solo — y en
`localStorage` queda legible por cualquier script que corra en la página. La regla 4 del
`AGENTS.md` de este repo dice que los tokens de Strava van por las rutas de
`src/app/api/strava/*` y **nunca al cliente**. Hoy esa regla está a medias: el
`client_secret` sí está protegido, pero el refresh token viaja al navegador y vuelve en el
body de cada refresco.

**La decisión ya está tomada y no se reabre:** el refresh token pasa a vivir en una cookie
`httpOnly` que el JavaScript de la página no puede leer. El servidor la escribe, la lee y
la rota. El cliente nunca la ve.

Esto **no** implica agregar base de datos ni cuentas de usuario. La cookie vive en el
dispositivo del usuario, igual que hoy, así que la promesa que la propia UI hace en
`src/components/TokenInput/index.tsx` —*"sin almacenar información en servidores… todo
queda guardado únicamente en este dispositivo"*— se mantiene intacta. No la toques.

---

## Territorio

**Tuyo, en exclusiva:**

- `src/app/api/strava/callback/route.ts`
- `src/app/api/strava/refresh/route.ts`
- `src/app/api/strava/disconnect/route.ts` (nuevo)
- `src/hooks/useToken.ts`
- `src/components/AppClient/index.tsx`
- `src/components/TokenInput/**`
- `src/__tests__/shared/useToken.test.tsx`, `src/__tests__/shared/useTokenSsr.test.tsx`

**Ajeno — no lo toques aunque veas algo mejorable.** Otros tres frentes corren en paralelo
sobre este mismo repo:

- **Frente B** está renombrando el tipo `StravaActivity` a `Activity` en `src/types/`,
  `src/lib/`, `src/utils/`, `src/services/`, `src/hooks/useActivities.ts`,
  `src/hooks/useStravaData.tsx` y los imports de tipo de `src/components/`.
- **Frente C** crea `src/services/providers/garmin/**` y `src/lib/polylineEncoder.ts`.
- **Frente D** hace la PWA: `src/app/layout.tsx`, `src/app/manifest.ts`, `public/**`,
  `src/components/pwa/**`, `src/app/offline/**`, `next.config.ts`.

`src/components/AppClient/index.tsx` es **tuyo**. El frente B fue instruido explícitamente
de no tocarlo: los cambios de tipo que hace no requieren editarlo (AppClient no importa
`StravaActivity`; recibe las actividades ya tipadas desde `useActivities`). Si al terminar
ves que no compila por algo que hizo B, **eso se resuelve en la integración, no acá**.

**No toques `package.json`.** No hace falta ninguna dependencia nueva.

---

## Qué construir

### 1. `src/app/api/strava/callback/route.ts`

Hoy mete los tres valores (access token, refresh token, expiración) en una sola cookie
legible de 60 segundos, que `AppClient` lee y borra.

Pasa a escribir **dos** cookies:

| Cookie | httpOnly | maxAge | Contenido | Para qué |
|---|---|---|---|---|
| `strava_refresh` | **sí** | 1 año | el refresh token, sin envolver en JSON | la credencial de larga vida |
| `strava_session` | no | 60 s | `{"access_token": "...", "expires_at": 123}` | el traspaso puntual al cliente, como hoy |

Detalles que importan:

- `strava_refresh` va con `path: '/api/strava'`. Acotar el path es lo que impide que la
  cookie viaje en cada request de navegación y de asset; sólo la necesitan las rutas que
  hablan con Strava.
- `secure: process.env.NODE_ENV === 'production'`. En producción sí; en `localhost` no,
  porque `next dev` sirve por HTTP y una cookie `secure` no se guardaría.
- `sameSite: 'lax'`. Es lo mínimo que funciona: el usuario vuelve desde
  `strava.com` por una navegación de tipo GET, y `lax` permite exactamente eso. `strict`
  rompería el retorno del OAuth.
- Renombrá la cookie legible de `strava_oauth` a `strava_session` y ajustá el lector en
  `AppClient`. El nombre viejo describía "el resultado del OAuth" y ahora describe otra
  cosa.
- Poné también una cookie **legible** `strava_connected=1` (mismo maxAge que
  `strava_refresh`, `path: '/'`, sin httpOnly). No contiene ningún secreto: es sólo una
  bandera. Existe porque el cliente **no puede ver** la cookie httpOnly y necesita saber
  si tiene sentido intentar un refresco al arrancar. Sin ella, un usuario que vuelve al
  día siguiente vería la pantalla de conectar aunque su autorización siga vigente — que es
  exactamente el bug que estamos arreglando.

### 2. `src/app/api/strava/refresh/route.ts`

Hoy lee el refresh token del **body** que le manda el cliente. Pasa a leerlo de la cookie
`strava_refresh` y a **ignorar el body por completo** (no lo parsees; si el cliente manda
algo, no se usa).

Contrato de respuesta:

- **Sin cookie** → `401 {"error":"no_session"}`. Nunca hubo autorización, o ya se
  desconectó.
- **Strava responde OK** → escribí la cookie `strava_refresh` con el refresh token
  **nuevo** (Strava lo rota: el viejo queda invalidado, y perder el nuevo deja al usuario
  afuera hasta que vuelva a autorizar) y devolvé al cliente **solamente**
  `{access_token, expires_at}`. El refresh token no sale de acá.
- **Strava responde 400 o 401** → la autorización fue revocada por el usuario desde
  `strava.com/settings/apps`, o el refresh token ya no sirve. Borrá la cookie
  `strava_refresh` y la bandera `strava_connected`, y devolvé
  `401 {"error":"reauthorize"}`.
- **Strava responde 5xx, o el `fetch` tira** → es un problema transitorio, no un rechazo.
  **No borres nada** y devolvé `503 {"error":"transient"}`.

Esa distinción es el punto entero del paso 2 y no es cosmética: hoy cualquier fallo cae en
el mismo `refresh_failed` con 401, así que un corte de red de treinta segundos tiene el
mismo efecto que revocar el acceso — se descarta una credencial que seguía siendo válida.
La pregunta correcta al escribir cada rama es **"¿Strava dijo que no, o no pude
preguntarle?"**, y sólo lo primero cierra la sesión.

**No loguees el token ni el body de la respuesta de Strava.** Ni con `console.log` de
depuración que "después saco".

### 3. `src/app/api/strava/disconnect/route.ts` (nuevo)

`POST` que borra `strava_refresh` y `strava_connected` (seteándolas con `maxAge: 0`) y
devuelve `204`. Es lo que hace que el botón de desconectar realmente desconecte: hoy
`clearToken()` limpia el `sessionStorage` del navegador pero, con este cambio, la cookie
httpOnly sobreviviría a un logout si nadie la borra del lado del servidor.

Aclará en un comentario que esto **no revoca la autorización en Strava** — eso el usuario
lo hace desde `strava.com/settings/apps`, y ese enlace ya está en la UI
(`src/components/TokenInput/index.tsx`).

### 4. `src/hooks/useToken.ts`

- `StoredToken` pierde el campo `refreshToken`. Queda `{ accessToken, expiresAt,
  createdAt }`. **Que el tipo ya no pueda representar un refresh token es la mitad del
  arreglo**: no queda ninguna vía por la que se cuele de vuelta al almacenamiento del
  navegador.
- `sessionStorage` → `localStorage`. El access token dura 6 horas y se puede volver a
  pedir; guardarlo en el dispositivo es aceptable y evita un ida y vuelta al servidor en
  cada carga.
- El descarte del formato viejo que hoy hace `readStored` (líneas 20-24: si no hay
  `refreshToken`, borra) hay que **invertirlo**: ahora un valor guardado **con**
  `refreshToken` es el formato viejo. Descartalo y borrá esa entrada — además de estar
  desactualizada, es una credencial de larga vida que quedó en el disco de gente que ya usó
  la app, y esta es la única oportunidad de limpiarla. Ojo: el formato viejo vivía en
  `sessionStorage` y el nuevo en `localStorage`, así que limpiá **los dos**.
- `refreshToken(...)` pasa a llamar a `/api/strava/refresh` **sin body**, y a distinguir
  las tres respuestas del paso 2. Devolvé algo que permita diferenciarlas, por ejemplo
  `{ estado: 'ok', token } | { estado: 'reautorizar' } | { estado: 'sin-red' }`. Un `null`
  para todo obliga a quien llama a asumir lo peor.
- Conservá el `refreshingRef`: sigue siendo necesario para que dos llamadas simultáneas en
  la misma pestaña no disparen dos refrescos, donde el segundo usaría un refresh token que
  el primero ya invalidó.
- Agregá `hasSession`: `true` si hay access token guardado **o** si existe la cookie
  `strava_connected`. Es lo que `AppClient` mira para decidir si intenta reconectar en vez
  de mostrar la pantalla de conexión.
- `clearToken()` pasa a ser `async` y llama a `POST /api/strava/disconnect` además de
  limpiar el `localStorage`.
- Cuidado con el SSR: hay un test (`useTokenSsr.test.tsx`) que fija que el hook no explota
  cuando no hay `window`. Toda lectura de `localStorage` o de `document.cookie` va detrás
  de un `typeof window === 'undefined'`, como ya lo hace `readStored`.

### 5. `src/components/AppClient/index.tsx`

- `readAndClearOAuthCookie()` lee ahora `strava_session` y ya no espera un
  `refresh_token` adentro. Si no viene `access_token`, devolvé `null` igual que hoy.
- **El arranque cambia**, y es el corazón del arreglo. Hoy: si no hay token en storage,
  pantalla de conectar. Ahora, al montar:
  1. ¿Vengo del OAuth (cookie `strava_session`)? → guardar y cargar. Igual que hoy.
  2. ¿Hay access token válido en `localStorage`? → cargar. Igual que hoy.
  3. **¿No hay access token pero sí `hasSession`?** → intentá un refresco antes de
     rendirte. Si sale bien, cargá normalmente y el usuario nunca ve la pantalla de
     conexión. Si vuelve `reautorizar`, ahí sí mostrala. Si vuelve `sin-red`, mostrá el
     error de red — **no** la pantalla de conexión, porque la sesión sigue estando bien y
     mandarlo a reautorizar sería mentirle sobre lo que pasó.
  4. Nada de lo anterior → pantalla de conexión.
- Mientras corre el paso 3 hace falta un estado visible. Ya existe el camino de "loading"
  con `<Dashboard loading>`; reusalo, no inventes una pantalla nueva.
- El manejo de `scope_missing` que ya está (líneas 76-82) se conserva tal cual: ahí sí hay
  que reautorizar, porque un refresh token no puede ganar permisos que no tiene.
- `handleLogout` ahora espera al `clearToken()` asíncrono.

---

## Qué NO hacer

- **No agregues base de datos, backend, ni cuentas de usuario.** Platenzen no tiene ninguna
  de las tres cosas y esta tarea no las introduce.
- **No toques la copia de `TokenInput`** sobre privacidad y almacenamiento local: sigue
  siendo verdad después de tu cambio, y es una promesa de producto.
- **No escribas tests nuevos.** Sí tenés que dejar pasando los que ya existen: si
  `useToken.test.tsx` describe comportamiento que acabás de cambiar a propósito, actualizá
  esos casos al contrato nuevo — pero **no sumes cobertura** del código nuevo. Eso se hace
  una sola vez, sobre el resultado ya integrado de los cuatro frentes, y un test escrito
  ahora contra tu suposición de cómo van a quedar los otros frentes describe algo que
  quizás nunca exista. Lo que sí hacés es **anotar en tu feedback qué merece test**.
- **No renombres `useStravaData` ni `StravaDataProvider`.** Los consume el frente B y las
  tres páginas de `src/app/(app)/`.
- **No intentes resolver el refresco concurrente entre pestañas distintas.** El
  `refreshingRef` cubre una pestaña. Dos pestañas abiertas pueden pisarse un refresh token,
  y resolverlo bien necesita un `BroadcastChannel` o un lock — es una decisión de alcance,
  no un detalle. Anotalo en el feedback y seguí.

---

## Verificación de cierre

Corré, desde el worktree, en este orden, y **pegá la salida real en tu feedback** — no un
"quedó todo bien":

```bash
npx tsc --noEmit
npm run lint
npx jest
npm run build
```

El piso que heredás: **556 tests en 31 suites, todos verdes; lint con 0 errores y 6
warnings preexistentes; build limpio.** Si tu cambio baja ese piso, no está terminado.
Los 6 warnings ya estaban y no son tuyos: no los arregles, están fuera de tu territorio.

Lo que **no** podés verificar y por lo tanto no se te pide: el flujo OAuth real contra
Strava necesita credenciales y un navegador. Anotá en el feedback que quedó sin probar de
punta a punta, para la lista de revisión humana.

---

## Feedback

Dejá `docs/feedback-frente-a.md`, **escrito a medida que avanzás, no de un tirón al
final** (si la sesión se corta, lo ya escrito es lo que permite retomar):

- Las decisiones que tomaste donde este plan dejaba margen, y por qué.
- Los desvíos del plan, si seguirlo al pie de la letra daba algo roto — explicados, no
  sólo declarados.
- Lo que quedó pendiente de integración por ser territorio ajeno.
- Deuda preexistente que hayas visto al pasar, con archivo y línea. No la arregles.
- **El inventario de qué merece test** de todo lo que escribiste: qué casos, qué contratos,
  qué ramas de error.
- La salida real de los cuatro comandos de verificación.
