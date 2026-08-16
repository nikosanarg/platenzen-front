/**
 * Pantalla de conexión.
 *
 * Muestra los dos proveedores que Platenzen sabe leer aunque sólo uno se pueda
 * conectar hoy. Lo que se fija acá es que el que está apagado se vea apagado y
 * no haga nada, pero siga siendo alcanzable para quien navega con teclado o
 * lector de pantalla — que es la razón de usar `aria-disabled` y no el
 * `disabled` nativo.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import TokenInput from '@/components/TokenInput';
import { InstalacionPWAProvider } from '@/components/pwa/useInstalacionPWA';

function pantalla() {
  return render(
    <InstalacionPWAProvider>
      <TokenInput />
    </InstalacionPWAProvider>
  );
}

describe('proveedores ofrecidos', () => {
  it('ofrece Strava como la acción principal', () => {
    pantalla();

    expect(screen.getByRole('button', { name: /conectar con strava/i })).toBeInTheDocument();
  });

  it('muestra Garmin, en vez de esconderlo hasta que se pueda usar', () => {
    pantalla();

    expect(screen.getByRole('button', { name: /conectar con garmin/i })).toBeInTheDocument();
  });

  it('marca Garmin como deshabilitado sin sacarlo del alcance del teclado', () => {
    pantalla();
    const garmin = screen.getByRole('button', { name: /conectar con garmin/i });

    expect(garmin).toHaveAttribute('aria-disabled', 'true');
    // El `disabled` nativo lo sacaría del foco y nadie llegaría a la explicación.
    expect(garmin).not.toBeDisabled();
  });

  it('explica por qué Garmin está apagado en texto visible, no sólo en un tooltip', () => {
    pantalla();

    const nota = screen.getByText(/garmin todavía no está habilitado/i);
    expect(nota).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /conectar con garmin/i })).toHaveAttribute(
      'aria-describedby',
      nota.id
    );
  });

  it('no navega a ningún lado al tocar Garmin', () => {
    pantalla();
    const antes = window.location.href;

    fireEvent.click(screen.getByRole('button', { name: /conectar con garmin/i }));

    expect(window.location.href).toBe(antes);
  });
});

describe('instalación de la app desde la pantalla de conexión', () => {
  /** Chrome emite `beforeinstallprompt` una sola vez; acá se simula esa emisión. */
  function emitirPromptDeInstalacion() {
    const evento = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    };
    evento.prompt = jest.fn().mockResolvedValue(undefined);
    evento.userChoice = Promise.resolve({ outcome: 'accepted' as const });
    // El evento llega de afuera de React: sin `act` el estado que dispara no se
    // aplica antes de que el test mire el DOM.
    act(() => {
      window.dispatchEvent(evento);
    });
    return evento;
  }

  it('no ofrece instalar cuando el navegador no lo permite', () => {
    pantalla();

    expect(screen.queryByRole('button', { name: /instalar/i })).not.toBeInTheDocument();
  });

  it('ofrece instalar recién cuando el navegador avisa que se puede', () => {
    pantalla();

    emitirPromptDeInstalacion();

    expect(screen.getByRole('button', { name: /instalar platenzen como app/i })).toBeInTheDocument();
  });

  it('dispara el prompt nativo del navegador al tocarlo', async () => {
    pantalla();
    const evento = emitirPromptDeInstalacion();

    // `instalar()` espera a `userChoice`, así que el click deja una promesa
    // pendiente que hay que dejar resolver adentro de `act`.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /instalar platenzen como app/i }));
    });

    expect(evento.prompt).toHaveBeenCalled();
    // Aceptada la instalación, la oferta se retira.
    expect(screen.queryByRole('button', { name: /instalar/i })).not.toBeInTheDocument();
  });

  it('deja de ofrecerlo una vez que la app quedó instalada', () => {
    pantalla();
    emitirPromptDeInstalacion();

    act(() => {
      fireEvent(window, new Event('appinstalled'));
    });

    expect(screen.queryByRole('button', { name: /instalar/i })).not.toBeInTheDocument();
  });
});
