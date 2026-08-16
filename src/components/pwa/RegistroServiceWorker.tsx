'use client';

import { useEffect, useState } from 'react';
import { InstallButton, IOSBanner, UpdateBanner, UpdateButton } from './styled';
import { useInstalacionPWA } from './useInstalacionPWA';

/**
 * RegistroServiceWorker — ciclo de vida de la PWA de Platenzen.
 *
 * Base: `mixbol-front/components/pwa/RegistroServiceWorker.tsx`. Se toma de
 * ahí el registro con detección de actualización (`updatefound` →
 * `statechange`) y `navigator.storage.persist()`.
 *
 * El estado de instalación **no** vive acá sino en `useInstalacionPWA`:
 * `beforeinstallprompt` llega una sola vez y hay que quedárselo, así que un
 * único dueño lo captura y lo reparte. Este componente sólo dibuja el botón
 * flotante, que es el respaldo — se esconde cuando alguna pantalla ya ofrece la
 * instalación embebida en su propio layout.
 *
 * Lo que NO se copia de Mixbol, y por qué (ver el historial de la tanda):
 * - El banner de actualización ahí se arma con `document.createElement` +
 *   `innerHTML`. Es deuda de aquel repo: un banner es un componente de React,
 *   va con estado y JSX como el resto de la UI.
 * - El `console.log('SW registered:', registration)`: ruido en producción.
 * - `useToast`: Platenzen no tiene ese contexto.
 */
export default function RegistroServiceWorker() {
  const [actualizacionLista, setActualizacionLista] = useState(false);
  const { sePuedeInstalar, instalar, esIOS, anclajesInline } = useInstalacionPWA();

  useEffect(() => {
    /**
     * Registro sólo en producción y sobre contexto seguro.
     *
     * En `next dev` un service worker sirve chunks de una compilación
     * anterior y produce errores de hidratación y módulos que no existen —
     * Valle Verde perdió una tarde ahí. `isSecureContext` cubre el caso de
     * un despliegue de preview servido por http a secas (SW requiere https,
     * salvo localhost).
     */
    if (process.env.NODE_ENV !== 'production') return;
    if (!window.isSecureContext) return;

    /**
     * Pedir almacenamiento persistente.
     *
     * Sin este permiso, Chrome en Android trata los datos del sitio como
     * "best-effort" y los desaloja si el celular anda justo de espacio —
     * localStorage se va entero, que es donde vive el historial completo de
     * actividades cacheado (`src/lib/cache.ts`, TTL de 6 días): un par de MB
     * y varios minutos de descarga contra la API de Strava para reponerlo.
     * Si el navegador lo niega, no pasa nada: se sigue como hasta ahora.
     */
    if (navigator.storage?.persist) {
      navigator.storage
        .persisted()
        .then((yaPersistente) => (yaPersistente ? true : navigator.storage.persist()))
        .catch(() => false);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const nuevoWorker = registration.installing;
            if (!nuevoWorker) return;

            nuevoWorker.addEventListener('statechange', () => {
              // `installed` con un `controller` ya activo significa que no es
              // la primera instalación, sino una versión nueva esperando a
              // tomar control. Sin `controller` es la primera visita: no hay
              // nada previo que "actualizar".
              if (nuevoWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setActualizacionLista(true);
              }
            });
          });
        })
        .catch((error) => {
          console.error('No se pudo registrar el service worker:', error);
        });
    }
  }, []);

  const handleRecargarClick = () => {
    window.location.reload();
  };

  return (
    <>
      {sePuedeInstalar && anclajesInline === 0 && (
        <InstallButton onClick={instalar}>Instalar app</InstallButton>
      )}

      {esIOS && (
        <IOSBanner role="status">
          <strong>Agregar a pantalla de inicio</strong>
          <span>Tocá el ícono compartir (↗) y elegí &ldquo;Agregar a inicio&rdquo;.</span>
        </IOSBanner>
      )}

      {actualizacionLista && (
        <UpdateBanner role="status">
          <span>Hay una versión nueva de Platenzen disponible.</span>
          <UpdateButton onClick={handleRecargarClick}>Recargar</UpdateButton>
        </UpdateBanner>
      )}
    </>
  );
}
