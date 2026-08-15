'use client';

import { useEffect, useRef, useState } from 'react';
import { InstallButton, IOSBanner, UpdateBanner, UpdateButton } from './styled';

/**
 * `beforeinstallprompt` no está en los tipos de lib.dom todavía (Chrome lo
 * implementa fuera del estándar). Se tipa lo mínimo que se usa.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * RegistroServiceWorker — ciclo de vida de la PWA de Platenzen.
 *
 * Base: `mixbol-front/components/pwa/RegistroServiceWorker.tsx`. Se toma de
 * ahí el registro con detección de actualización (`updatefound` →
 * `statechange`), la captura de `beforeinstallprompt`, la detección de iOS
 * sin standalone, y `navigator.storage.persist()`.
 *
 * Lo que NO se copia de Mixbol, y por qué (ver docs/feedback-frente-d.md):
 * - El banner de actualización ahí se arma con `document.createElement` +
 *   `innerHTML`. Es deuda de aquel repo: un banner es un componente de React,
 *   va con estado y JSX como el resto de la UI, con `styled-components` (que
 *   es lo que ya usa este repo) en vez de `style.cssText` a mano.
 * - El `console.log('SW registered:', registration)`: ruido en la consola de
 *   producción.
 * - `useToast`: Platenzen no tiene ese contexto. El aviso de actualización se
 *   resuelve enteramente con el banner de abajo.
 */
export default function RegistroServiceWorker() {
  const [mostrarBotonInstalar, setMostrarBotonInstalar] = useState(false);
  const [mostrarBannerIOS, setMostrarBannerIOS] = useState(false);
  const [actualizacionLista, setActualizacionLista] = useState(false);
  const promptDiferidoRef = useRef<BeforeInstallPromptEvent | null>(null);

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
     * Esto importa más acá que en Mixbol, que no cachea nada tan pesado. Si
     * el navegador lo niega, no pasa nada: se sigue como hasta ahora.
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

    const manejarBeforeInstallPrompt = (evento: Event) => {
      evento.preventDefault();
      promptDiferidoRef.current = evento as BeforeInstallPromptEvent;
      setMostrarBotonInstalar(true);
    };

    window.addEventListener('beforeinstallprompt', manejarBeforeInstallPrompt);

    const manejarAppInstalada = () => {
      promptDiferidoRef.current = null;
      setMostrarBotonInstalar(false);
    };

    window.addEventListener('appinstalled', manejarAppInstalada);

    // iOS/Safari no dispara `beforeinstallprompt`: la única forma de instalar
    // ahí es "Compartir → Agregar a inicio", y hay que decirlo a mano.
    const esIOS =
      /iPhone|iPad|iPod/.test(navigator.userAgent) &&
      !(window.navigator as Navigator & { standalone?: boolean }).standalone;
    const esSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    if (esIOS && esSafari) {
      // Mismo patrón que `Dashboard/index.tsx` para el flag `isMounted`: esto
      // sólo puede saberse después de montar (depende de `navigator`, que no
      // existe en SSR), así que el setState síncrono dentro del efecto es
      // intencional, no un efecto derivable de props/estado.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMostrarBannerIOS(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', manejarBeforeInstallPrompt);
      window.removeEventListener('appinstalled', manejarAppInstalada);
    };
  }, []);

  const handleInstalarClick = async () => {
    if (!promptDiferidoRef.current) return;

    promptDiferidoRef.current.prompt();
    const { outcome } = await promptDiferidoRef.current.userChoice;
    if (outcome === 'accepted') {
      promptDiferidoRef.current = null;
      setMostrarBotonInstalar(false);
    }
  };

  const handleRecargarClick = () => {
    window.location.reload();
  };

  return (
    <>
      {mostrarBotonInstalar && (
        <InstallButton onClick={handleInstalarClick}>Instalar app</InstallButton>
      )}

      {mostrarBannerIOS && (
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
