# Revisión manual pendiente

Lo que la suite automática **no puede** verificar de la tanda de proveedores + PWA, reunido
de los cuatro frentes en una sola lista. No es trabajo sin hacer: es trabajo que necesita
un navegador real y credenciales de Strava, que ningún proceso automático de este repo
tiene.

Nada de esto bloquea el build ni los tests. Todo esto conviene hacerlo **antes de
desplegar**.

---

## 1. El flujo OAuth de Strava, de punta a punta

Es lo más importante de la lista: se reescribió cómo se guarda la sesión y no se pudo
probar contra Strava.

1. `npm run build && npm run start` (el service worker sólo se registra en producción).
2. Conectar con Strava desde cero. Confirmar en DevTools → Application → Cookies:
   - `strava_refresh` existe, tiene la marca **HttpOnly**, y su `Path` es `/api/strava`.
   - `strava_session` desaparece a los 60 segundos y **no contiene** el refresh token.
   - `strava_connected` existe y es legible.
3. **Cerrar la pestaña por completo y volver a entrar.** El dashboard tiene que cargar sin
   pedir autorización de nuevo — es el bug que motivó todo el frente A.
4. Esperar a que expire el access token (6 h) o adelantar el reloj, y confirmar que el
   refresco es silencioso.
5. Revocar el acceso desde [strava.com/settings/apps](https://www.strava.com/settings/apps)
   y recargar: ahí sí tiene que aparecer la pantalla de conexión.
6. Cortar la red y recargar: tiene que aparecer el error de red **con opción de
   reintentar**, no la pantalla de conexión. Son dos situaciones distintas y la app ahora
   las distingue.
7. Desconectar desde la app y confirmar que las tres cookies se borran.

## 2. Instalación de la PWA

**Ojo antes de empezar**: el botón de instalar **no aparece con `npm run dev`**. El
navegador sólo emite `beforeinstallprompt` con manifiesto y service worker activos, y el
worker se registra sólo en producción. Hay que probar con `npm run build && npm run start`.

Dónde tiene que aparecer la oferta, y **una sola a la vez**:

- En la pantalla de conexión, embebida abajo de todo, separada por una línea.
- Ya con sesión, como botón naranja en el encabezado del dashboard, a la izquierda de
  "Actualizar datos".
- El botón flotante de la esquina es el respaldo: **no** tiene que verse cuando alguna de
  las dos anteriores está en pantalla.
- Después de instalar, ninguna de las tres tiene que seguir ofreciéndola.

- **Desktop (Chrome/Edge)**: el manifiesto carga sin errores en DevTools → Application →
  Manifest; aparece el ícono de instalar; la app instalada abre en modo standalone y sin
  fogonazo blanco al arrancar.
- **Android (Chrome, sobre HTTPS real)**: aparece el botón propio "Instalar app"; al
  instalar, el botón desaparece. **Mirar el ícono en el launcher**: es donde se va a ver el
  recorte por falta de variante `maskable`. Sacar una captura sirve de referencia concreta
  para quien genere los íconos definitivos.
- **iOS (Safari)**: aparece el cartel de "Agregar a pantalla de inicio"; agregándola a mano,
  abre standalone. Confirmar de paso que el cartel **no** aparece en Chrome para iOS.

## 3. El service worker no puede tocar el OAuth

La verificación que cruza los dos frentes más delicados, y la única forma de comprobarla es
mirando la red:

- Con la PWA instalada y el worker activo, completar el flujo de Strava.
- En DevTools → Network, confirmar que **ninguna** petición a `/api/strava/*` aparece
  servida `(from ServiceWorker)`, y que las cookies se actualizan con normalidad.

## 4. Comportamiento sin conexión

- Con varias pantallas ya visitadas (`/`, `/achievements`, `/comparative`), poner el
  navegador en modo offline.
- Las pantallas visitadas tienen que seguir abriendo **con datos** (vienen de
  `localStorage`; el shell, del worker).
- Una ruta nunca visitada tiene que mostrar `offline.html`.

## 5. Actualización de versión

- Con la app instalada y abierta, desplegar un cambio (o subir `CACHE_NAME` en
  `public/sw.js`) y recargar: tiene que aparecer el cartel de versión nueva, y el botón
  "Recargar" tiene que traerla.
- En una instalación **nueva** el cartel **no** tiene que aparecer.

## 6. Almacenamiento persistente

`navigator.storage.persisted()` en la consola, antes y después de instalar la PWA. Importa
porque sin el permiso, Android puede desalojar el historial completo de actividades cuando
el teléfono anda justo de espacio — y volver a bajarlo son varios minutos contra la API de
Strava.

---

## Lo que no se puede verificar de ninguna manera hoy

**El mapper de Garmin nunca vio un payload real.** No hay forma de conseguir uno sin acceso
al Garmin Connect Developer Program, que es sólo para empresas y con aprobación. Los tests
de `src/__tests__/providers/` fijan el contrato contra la documentación pública; que la
documentación describa fielmente lo que Garmin manda es una suposición, no un hecho
verificado. Ver `docs/matriz-proveedores.md`.
