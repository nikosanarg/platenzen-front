/**
 * Coordinación de la oferta de instalación.
 *
 * `beforeinstallprompt` llega **una sola vez**, así que un único dueño lo
 * captura y lo reparte. De ahí sale la regla que se fija acá: el botón flotante
 * es el respaldo y se esconde cuando alguna pantalla ya ofrece la instalación
 * embebida en su propio layout. Sin esto aparecen dos botones que hacen lo
 * mismo, uno de ellos tapando contenido.
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import {
  InstalacionPWAProvider,
  useBotonInstalacionInline,
  useInstalacionPWA,
} from '@/components/pwa/useInstalacionPWA';

/** Sustituto del botón flotante: aplica la misma condición que `RegistroServiceWorker`. */
const Flotante: React.FC = () => {
  const { sePuedeInstalar, anclajesInline } = useInstalacionPWA();
  if (!sePuedeInstalar || anclajesInline > 0) return null;
  return <button>Instalar app</button>;
};

/** Sustituto de un botón embebido en una pantalla (login o topbar). */
const Embebido: React.FC = () => {
  const { sePuedeInstalar } = useBotonInstalacionInline();
  if (!sePuedeInstalar) return null;
  return <button>Instalar desde la pantalla</button>;
};

function emitirPrompt() {
  const evento = new Event('beforeinstallprompt') as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  };
  evento.prompt = jest.fn().mockResolvedValue(undefined);
  evento.userChoice = Promise.resolve({ outcome: 'accepted' as const });
  act(() => {
    window.dispatchEvent(evento);
  });
}

describe('quién ofrece instalar', () => {
  it('no ofrece nada mientras el navegador no avise que se puede', () => {
    render(
      <InstalacionPWAProvider>
        <Flotante />
      </InstalacionPWAProvider>
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('usa el botón flotante cuando la pantalla no ofrece ninguno', () => {
    render(
      <InstalacionPWAProvider>
        <Flotante />
      </InstalacionPWAProvider>
    );

    emitirPrompt();

    expect(screen.getByRole('button', { name: 'Instalar app' })).toBeInTheDocument();
  });

  it('cede el lugar al botón de la pantalla, sin ofrecer los dos a la vez', () => {
    render(
      <InstalacionPWAProvider>
        <Embebido />
        <Flotante />
      </InstalacionPWAProvider>
    );

    emitirPrompt();

    expect(screen.getByRole('button', { name: 'Instalar desde la pantalla' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument();
  });

  it('recupera el botón flotante cuando la pantalla que lo ofrecía se desmonta', () => {
    const { rerender } = render(
      <InstalacionPWAProvider>
        <Embebido />
        <Flotante />
      </InstalacionPWAProvider>
    );

    emitirPrompt();

    rerender(
      <InstalacionPWAProvider>
        <Flotante />
      </InstalacionPWAProvider>
    );

    expect(screen.getByRole('button', { name: 'Instalar app' })).toBeInTheDocument();
  });

  it('reparte la misma señal a varias pantallas montadas a la vez', () => {
    // El caso que motiva el contexto: si cada una escuchara por su cuenta, sólo
    // la primera vería el evento, que Chrome emite una única vez.
    render(
      <InstalacionPWAProvider>
        <Embebido />
        <Embebido />
      </InstalacionPWAProvider>
    );

    emitirPrompt();

    expect(screen.getAllByRole('button', { name: 'Instalar desde la pantalla' })).toHaveLength(2);
  });
});

describe('fuera del provider', () => {
  it('no rompe la pantalla: simplemente no hay nada que ofrecer', () => {
    expect(() => render(<Embebido />)).not.toThrow();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
