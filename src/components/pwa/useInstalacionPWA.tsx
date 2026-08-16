'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/**
 * `beforeinstallprompt` no está en los tipos de lib.dom (Chrome lo implementa
 * fuera del estándar). Se tipa lo mínimo que se usa.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstalacionPWA {
  /** Hay un prompt de instalación disponible y la app todavía no está instalada. */
  sePuedeInstalar: boolean;
  /** Dispara el prompt nativo. No hace nada si no hay uno disponible. */
  instalar: () => Promise<void>;
  /** iOS/Safari nunca dispara `beforeinstallprompt`: ahí sólo se puede explicar el camino a mano. */
  esIOS: boolean;
  /** Cuántos botones de instalación embebidos hay montados ahora mismo. */
  anclajesInline: number;
  registrarAnclaje: () => () => void;
}

/**
 * El estado de instalación de la PWA, en un solo lugar.
 *
 * Vive acá y no adentro de `RegistroServiceWorker` porque el evento
 * `beforeinstallprompt` llega **una sola vez** y hay que quedárselo: si dos
 * componentes escucharan por su cuenta, el segundo no vería nada. Con esto, la
 * pantalla de conexión, el encabezado del dashboard y el botón flotante ofrecen
 * la misma instalación desde la misma señal.
 *
 * `anclajesInline` existe para que no aparezcan dos botones a la vez: el
 * flotante es el respaldo y se esconde solo cuando alguna pantalla ya ofrece la
 * instalación en su propio layout, que siempre queda mejor que un botón
 * pegado a una esquina.
 */
const InstalacionPWAContext = createContext<InstalacionPWA | null>(null);

export const InstalacionPWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sePuedeInstalar, setSePuedeInstalar] = useState(false);
  const [esIOS, setEsIOS] = useState(false);
  const [anclajesInline, setAnclajesInline] = useState(0);
  const promptDiferidoRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const manejarPrompt = (evento: Event) => {
      // Sin `preventDefault` Chrome muestra su propio mini-infobar además del
      // botón nuestro, y quedan dos formas de instalar compitiendo.
      evento.preventDefault();
      promptDiferidoRef.current = evento as BeforeInstallPromptEvent;
      setSePuedeInstalar(true);
    };

    const manejarInstalada = () => {
      promptDiferidoRef.current = null;
      setSePuedeInstalar(false);
      setEsIOS(false);
    };

    window.addEventListener('beforeinstallprompt', manejarPrompt);
    window.addEventListener('appinstalled', manejarInstalada);

    // iOS/Safari: la única vía es "Compartir → Agregar a inicio". `standalone`
    // en true significa que ya se abrió desde el ícono, así que no hay nada que
    // ofrecer.
    const enIOS =
      /iPhone|iPad|iPod/.test(navigator.userAgent) &&
      !(window.navigator as Navigator & { standalone?: boolean }).standalone;
    const enSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);

    if (enIOS && enSafari) {
      // Sólo se puede saber después de montar (depende de `navigator`, que no
      // existe en SSR): el setState síncrono acá es intencional, mismo patrón
      // que el flag `isMounted` de `Dashboard/index.tsx`.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEsIOS(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', manejarPrompt);
      window.removeEventListener('appinstalled', manejarInstalada);
    };
  }, []);

  const instalar = useCallback(async () => {
    const prompt = promptDiferidoRef.current;
    if (!prompt) return;

    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      promptDiferidoRef.current = null;
      setSePuedeInstalar(false);
    }
    // Si lo descarta, el botón se queda: el prompt diferido sigue sirviendo y
    // puede cambiar de opinión. Chrome no vuelve a emitir el evento.
  }, []);

  const registrarAnclaje = useCallback(() => {
    setAnclajesInline((n) => n + 1);
    return () => setAnclajesInline((n) => n - 1);
  }, []);

  return (
    <InstalacionPWAContext.Provider
      value={{ sePuedeInstalar, instalar, esIOS, anclajesInline, registrarAnclaje }}
    >
      {children}
    </InstalacionPWAContext.Provider>
  );
};

/**
 * Fuera del provider devuelve un estado inerte en vez de tirar: hay pantallas
 * que se montan sueltas en tests y ninguna debería romperse por no poder
 * ofrecer una instalación.
 */
export function useInstalacionPWA(): InstalacionPWA {
  return (
    useContext(InstalacionPWAContext) ?? {
      sePuedeInstalar: false,
      instalar: async () => {},
      esIOS: false,
      anclajesInline: 0,
      registrarAnclaje: () => () => {},
    }
  );
}

/**
 * Para un botón de instalación embebido en una pantalla. Devuelve si hay algo
 * que ofrecer, y mientras esté montado esconde el botón flotante.
 */
export function useBotonInstalacionInline(): { sePuedeInstalar: boolean; instalar: () => Promise<void> } {
  const { sePuedeInstalar, instalar, registrarAnclaje } = useInstalacionPWA();

  useEffect(() => registrarAnclaje(), [registrarAnclaje]);

  return { sePuedeInstalar, instalar };
}
