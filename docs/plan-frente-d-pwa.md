# Frente D — Platenzen se instala

**Worktree:** `c:\Users\Usuario\repos\platenzen-front-d`
**Rama:** `frente/d-pwa`
**Modelo sugerido:** Sonnet

Trabajás solo, en un worktree aislado, sobre un repo que no viste antes. Este documento
tiene que alcanzarte: no hay conversación previa que consultar.

---

## Qué se pide, y qué explícitamente no

Que Platenzen se pueda **instalar** desde el navegador y abrir como aplicación: manifiesto
válido, íconos, apertura standalone, caché razonable de assets y actualización correcta
cuando se despliega una versión nueva.

Lo que **no** se pide, textual del pedido:

> *"No convertir Platenzen en una aplicación offline-first artificialmente. Para
> funcionalidades que requieren datos remotos, mantener el comportamiento online actual."*

Y una restricción de seguridad que manda sobre todo lo demás:

> *"Los redirects OAuth de Strava y Garmin no deben romperse por convertir Platenzen en
> PWA. La PWA es una capa de distribución/experiencia del frontend, no una razón para mover
> credenciales OAuth al cliente."*

Traducido a una regla operativa que vas a aplicar varias veces: **el service worker no
toca `/api` jamás.** Ni lo cachea, ni lo intercepta, ni lo reintenta. Ahí viven el
intercambio de código por token y el refresco de credenciales de Strava; una respuesta de
esas servida desde caché es un token viejo aplicado a una sesión nueva.

Buena noticia sobre el offline: **no tenés que hacer nada para conseguirlo.** Platenzen ya
guarda el historial completo de actividades en `localStorage` (`src/lib/cache.ts`, TTL de 6
días) y todos los cálculos corren en el cliente. Si el shell de la app está cacheado, el
dashboard abre sin conexión y muestra datos reales, solo. No agregues caché de datos: ya
está resuelto en otra capa.

---

## Los dos antecedentes que tenés que leer antes de escribir

Este patrón ya se implementó dos veces en repos hermanos de la misma persona. **Leelos
como referencia, no los copies a ciegas** — el pedido dice explícitamente "identificar
diferencias" y "tomar el patrón que haya demostrado ser más estable".

- **`c:\Users\Usuario\repos\mixbol-front\public\sw.js`** (191 líneas) — el más cercano a lo
  que necesitás: `/api` sin interceptar, navegaciones network-first con fallback a una
  página offline, assets estáticos stale-while-revalidate, sin cola de escrituras. **Esta
  es tu base.** Ignorá sus handlers de `push` y `notificationclick`: son de notificaciones
  push, que Platenzen no tiene.
- **`c:\Users\Usuario\repos\valle-verde\public\sw.js`** (294 líneas) y
  **`c:\Users\Usuario\repos\valle-verde\app\manifest.ts`** — más elaborado, con caché de
  datos de API, marca de antigüedad y poda por cuota. **Casi todo eso no aplica acá**
  porque Platenzen no cachea `/api`. De Valle Verde tomá dos cosas: la forma del
  `app/manifest.ts` (es la ruta idiomática en App Router y Mixbol no la usa: sirve un
  `public/manifest.webmanifest` a mano) y el criterio de **no precachear los chunks de
  Next**, porque sus nombres llevan hash y cambian en cada deploy de Vercel — una lista fija
  queda vieja al primer push.

Dos lecciones ya pagadas por esos repos, que te ahorran el mismo golpe:

1. **`cache.addAll` es atómico**: si una sola URL del precache falla, no se instala nada y
   el sitio queda sin service worker, reintentando en cada carga. Mixbol lo resuelve
   cacheando URL por URL con `.catch(() => {})`. Hacé lo mismo.
2. **El `clone()` de una `Response` va antes de devolverla.** Apenas la devolvés, el
   navegador consume su body y `clone()` explota con *"Response body is already used"*.

---

## Territorio

**Tuyo:**

- `src/app/manifest.ts` (nuevo)
- `src/app/layout.tsx`
- `public/sw.js` (nuevo), `public/offline.html` o `src/app/offline/page.tsx` — elegí, ver
  abajo
- `public/` para íconos
- `src/components/pwa/**` (nuevo)
- `next.config.ts`, sólo si hiciera falta (probablemente no)

**Ajeno — no lo toques.** Tres frentes corren en paralelo sobre este repo:

- **Frente A**: `src/app/api/strava/**`, `src/hooks/useToken.ts`,
  `src/components/AppClient/index.tsx`, `src/components/TokenInput/**`. Está reescribiendo
  la persistencia de la sesión de Strava para que use una cookie `httpOnly`. **Esto te
  importa**: hay un ítem sobre eso más abajo.
- **Frente B**: `src/types/**`, `src/lib/**`, `src/utils/**`, `src/services/**`,
  `src/hooks/useActivities.ts`, `src/components/**` (imports de tipo).
- **Frente C**: `src/services/providers/garmin/**`, `src/lib/polylineEncoder.ts`.

`src/app/layout.tsx` es **tuyo**, pero es el layout raíz de toda la app: tocá **sólo** el
objeto `metadata` y el montaje del componente de registro. No reordenes providers, no
toques `StyledComponentsRegistry`.

**No agregues dependencias.** Ni `next-pwa`, ni `workbox`. Los dos repos de referencia
escribieron su service worker a mano, y son 190 y 290 líneas sin dependencias — un
generador para esto agrega una cadena de build que después hay que mantener.

---

## Qué construir

### 1. `src/app/manifest.ts`

Seguí la forma de `valle-verde/app/manifest.ts`: `export const dynamic = 'force-static'` y
una función que devuelve `MetadataRoute.Manifest`. Next lo sirve en
`/manifest.webmanifest`; **no crees un archivo en `public/`**.

- `name`: `'Platenzen — Estadísticas de running'`
- `short_name`: `'Platenzen'` (que entre bajo un ícono en Android: hasta ~12 caracteres)
- `description`: lo que dice el `README.md`, resumido.
- `lang: 'es'`, `display: 'standalone'`, `start_url: '/'`, `scope: '/'`.

  **`scope: '/'` acá y no `/admin` como en Valle Verde**: allá la PWA era sólo el panel
  interno de un sitio que también tiene parte pública; en Platenzen la app **es** el sitio
  entero.
- `background_color: '#0d0d0f'` y `theme_color: '#0d0d0f'`, que son `--bg-primary` de
  `src/app/globals.css`. Platenzen es una app oscura: un splash blanco produce un
  fogonazo en cada arranque.

  Ojo con la tentación de usar `--accent` (`#fc4c02`) como `theme_color`: es el naranja de
  **Strava**, y esta app está por dejar de ser sólo de Strava.
- `orientation: 'portrait'`.
- Íconos: el único cuadrado disponible es `/assets/platenzen_logo.png`, de **412×411**.
  Declaralo con `sizes: '412x411'` y `purpose: 'any'`. Alcanza para que Chrome considere la
  app instalable, que pide 192 o más.

  **Falta un juego propio 192/512 con variante `maskable`**, y sin él Android recorta el
  logo dentro de su máscara circular. **No lo generes** —necesita un asset de diseño, no
  código, y una imagen reescalada por código se va a ver peor que la que haga alguien
  mirándola—. Anotalo en el feedback como pendiente para revisión humana. Valle Verde tiene
  exactamente esta misma deuda y la resolvió así.

### 2. `public/sw.js`

Estructura sobre la base de Mixbol, sin sus handlers de push. En orden:

- Una constante de versión de caché (`platenzen-v1`). Subirla es lo que invalida todo lo
  cacheado cuando cambia el contenido de un archivo sin cambiar su nombre. Dejá dicho en un
  comentario cuándo hay que subirla.
- **`install`**: precachear lo mínimo, URL por URL y tolerando fallas (nunca `addAll`). Lo
  mínimo es la página offline y los íconos. **No precachees `/`**: es la ruta que sirve el
  dashboard, y aunque acá no hay middleware de sesión que la redirija —a diferencia de
  Mixbol, donde eso rompía el install entero—, tampoco gana nada: la primera visita la
  cachea sola por network-first.
- **`activate`**: borrar las cachés `platenzen-*` que no sean la actual, y `clients.claim()`.
- **`fetch`**, en este orden exacto de guardas:
  1. **Si `url.pathname` empieza con `/api` → `return` sin interceptar.** Primero de todo.
     Es la regla que protege el OAuth.
  2. Si el método no es `GET` → `return`. Lo que el worker nunca ve, no lo puede diferir.
  3. `request.mode === 'navigate'` → **network-first**, y ante fallo probar la caché y
     después la página offline.
  4. `/_next/static` y las imágenes/fuentes (`png|jpg|jpeg|svg|gif|webp|woff|woff2`) →
     stale-while-revalidate.
  5. Cualquier otra cosa → a la red, sin interceptar.

**Por qué las navegaciones van network-first y no stale-while-revalidate**, que es la
decisión de diseño de este archivo: con SWR el usuario ve siempre el resultado de la carga
anterior. En Valle Verde eso se probó y se revirtió — creabas algo, volvías a la lista y no
estaba. Acá el efecto sería más sutil y peor: el dashboard mostraría los números de la
sesión pasada como si fueran los de ahora, y los números son la promesa de este producto
(regla 1 del `AGENTS.md` del repo: *"un cálculo mal hecho no es un bug visual: le miente al
corredor sobre su progreso"*). Un dashboard lento es un problema; uno que miente con
confianza, otro.

### 3. La página offline

Dos opciones, elegí una y **decí en el feedback cuál y por qué**:

- **`public/offline.html`** (lo que hace Valle Verde): HTML plano, sin chunks de Next, sin
  fuentes, sin JS de la app. La ventaja es que es lo que tiene que funcionar cuando no
  funciona nada más, y no depende de nada. La desventaja es que no comparte estilos.
- **`src/app/offline/page.tsx`**: comparte el diseño, pero arrastra los chunks de Next, que
  llevan hash y cambian en cada deploy — justo lo que no se precachea.

**La recomendación es `public/offline.html`**, por el mismo motivo por el que Valle Verde
la eligió: si le agregás una dependencia, deja de servir justo cuando hace falta. Copiá los
colores a mano en un `<style>` inline y que quede breve.

### 4. `src/components/pwa/RegistroServiceWorker.tsx`

Componente cliente que monta el layout raíz. Base:
`c:\Users\Usuario\repos\mixbol-front\components\pwa\RegistroServiceWorker.tsx`.

Lo que **sí** tomás de ahí:

- El registro de `/sw.js` con la detección de `updatefound` → `statechange` → si
  `newWorker.state === 'installed'` **y ya hay `navigator.serviceWorker.controller`**,
  entonces es una actualización (no la primera instalación) y hay que ofrecer recargar.
- La captura de `beforeinstallprompt` para el botón "Instalar app".
- La detección de iOS/Safari sin standalone para el cartel de "Compartir → Agregar a
  inicio", porque Safari no dispara `beforeinstallprompt`.
- El `navigator.storage.persist()`. **Acá importa más que en Mixbol**: Chrome en Android
  desaloja el almacenamiento "best-effort" cuando el celular anda justo de espacio, y en
  Platenzen eso se lleva el historial completo de actividades cacheado, que puede ser un
  par de MB y varios minutos de descarga contra la API de Strava. Si el navegador lo niega,
  no pasa nada: se sigue como hasta ahora.

Lo que **no** copiás:

- **El banner de actualización construido con `document.createElement` e `innerHTML`.**
  Está así en Mixbol y es deuda: es un componente de React, el banner va con estado y JSX
  como el resto. Los estilos, con `styled-components`, que es lo que usa este repo.
- **El `console.log('SW registered:', registration)`.** Ruido en la consola de producción.
- El `useToast`: Platenzen no tiene ese contexto.

**Registro sólo en producción y sobre contexto seguro:**

```ts
if (process.env.NODE_ENV !== 'production') return;
if (!window.isSecureContext) return;
```

En `next dev` un service worker sirve chunks de una compilación anterior y produce errores
de hidratación y módulos que no existen — se pierde una tarde buscando el bug en el lugar
equivocado. Valle Verde lo aprendió así.

### 5. `src/app/layout.tsx`

- Ampliá `metadata`: sumá `applicationName`, `appleWebApp: { capable: true, statusBarStyle:
  'black-translucent', title: 'Platenzen' }` y `manifest: '/manifest.webmanifest'`.
- `themeColor` **no va en `metadata`** en Next 16: va en el export `viewport`
  (`export const viewport: Viewport = { themeColor: '#0d0d0f' }`). Si lo ponés en
  `metadata`, el build tira un warning de deprecación.
- Montá `<RegistroServiceWorker />` dentro de `<body>`, después de
  `StyledComponentsRegistry`.

### 6. Lo que tenés que verificar contra el frente A

El frente A está moviendo el refresh token de Strava a una **cookie `httpOnly` con
`path: '/api/strava'`** y agregando una cookie legible `strava_connected`. Nada de eso lo
tocás vos, pero **el service worker no puede interferir**: si alguna respuesta de `/api`
se sirviera desde caché, el `Set-Cookie` no llegaría y la sesión no se renovaría nunca.

La guarda de `/api` que ya es el primer `if` de tu `fetch` cubre exactamente eso. **Dejalo
escrito en un comentario del `sw.js`**, nombrando el motivo: el próximo que quiera "acelerar
la app cacheando las respuestas de la API" tiene que encontrarse ahí con la razón por la que
no se hace.

---

## Qué NO hacer

- **No caches `/api`.** Ni una excepción, ni "sólo los GET de lectura". Es la regla que
  protege las credenciales.
- **No agregues cola offline, outbox, Background Sync ni reintentos diferidos.** Ninguno de
  los dos repos de referencia lo tiene, y acá no hay ni escrituras que encolar.
- **No cachees datos de actividades.** Ya están en `localStorage`.
- **No agregues dependencias.**
- **No escribas tests.** Dejá en el feedback el **inventario** de qué merece cobertura:
  el registro sólo en producción, la guarda de `/api`, el fallback offline, el flujo de
  actualización. La pasada de cobertura se hace una vez sobre el resultado integrado de los
  cuatro frentes; un test escrito ahora contra tu suposición de cómo van a quedar los otros
  describe algo que quizás nunca exista.
- **No generes íconos por código.** Ver el punto 1.

---

## Verificación de cierre

```bash
npx tsc --noEmit
npm run lint
npx jest
npm run build
```

Piso heredado: **556 tests en 31 suites, todos verdes; lint 0 errores y 6 warnings
preexistentes; build limpio.** Los warnings no son tuyos, no los arregles.

Después del build, confirmá que `/manifest.webmanifest` aparece en la lista de rutas que
imprime `next build`.

**Lo que no podés verificar, y por lo tanto no se te pide**: instalar la app, abrirla
standalone, ver el splash, probar el flujo OAuth real contra Strava, o comprobar el
comportamiento sin conexión en un dispositivo. Todo eso necesita un navegador y
credenciales. **Listalo en tu feedback como pendiente de revisión humana**, con los pasos
concretos para hacerlo — es el entregable que reemplaza a la verificación que no podés
correr, y va a ser la única guía de quien lo pruebe.

---

## Feedback

Dejá `docs/feedback-frente-d.md`, **escrito a medida que avanzás, no al final**:

- Qué elegiste para la página offline y por qué.
- Las diferencias que encontraste entre las dos implementaciones de referencia y cuál
  seguiste en cada punto. El pedido lo marcó explícitamente como entregable.
- Desvíos del plan, explicados.
- Deuda preexistente vista al pasar, con archivo y línea. No la arregles. (El banner por
  `innerHTML` de Mixbol es de otro repo: no va acá.)
- El pendiente de los íconos 192/512 maskable, para revisión humana.
- **Inventario de qué merece test.**
- La lista de pasos para la verificación manual que no pudiste correr.
- La salida real de los cuatro comandos.
