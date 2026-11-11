/**
 * La versión nueva del service worker se avisa con un toast que no vence y
 * ofrece recargar. Sólo cuando ya había un worker controlando la página: la
 * primera instalación no tiene nada previo que actualizar.
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { ToastProvider } from 'kaizen-lib/ui';
import RegistroServiceWorker from '@/components/pwa/RegistroServiceWorker';
import { InstalacionPWAProvider } from '@/components/pwa/useInstalacionPWA';

type Oyente = () => void;

function simularServiceWorker(conController: boolean) {
  const worker = { state: 'installing', oyentes: [] as Oyente[], addEventListener: (_: string, f: Oyente) => worker.oyentes.push(f) };
  const registro = { installing: worker, oyentes: [] as Oyente[], addEventListener: (_: string, f: Oyente) => registro.oyentes.push(f) };
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { register: jest.fn().mockResolvedValue(registro), controller: conController ? {} : null },
  });
  return {
    async instalarVersionNueva() {
      await act(async () => {
        registro.oyentes.forEach(f => f());
        worker.state = 'installed';
        worker.oyentes.forEach(f => f());
      });
    },
  };
}

const entornoOriginal = process.env.NODE_ENV;

beforeEach(() => {
  (process.env as Record<string, string>).NODE_ENV = 'production';
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
});

afterEach(() => {
  (process.env as Record<string, string>).NODE_ENV = entornoOriginal as string;
});

function renderRegistro() {
  return render(
    <ToastProvider>
      <InstalacionPWAProvider>
        <RegistroServiceWorker />
      </InstalacionPWAProvider>
    </ToastProvider>
  );
}

it('con una versión anterior activa, avisa y ofrece recargar', async () => {
  const sw = simularServiceWorker(true);
  await act(async () => {
    renderRegistro();
  });
  await sw.instalarVersionNueva();

  expect(screen.getByText('Hay una versión nueva de Platenzen disponible.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Recargar' })).toBeInTheDocument();
});

it('en la primera instalación no avisa nada', async () => {
  const sw = simularServiceWorker(false);
  await act(async () => {
    renderRegistro();
  });
  await sw.instalarVersionNueva();

  expect(screen.queryByText('Hay una versión nueva de Platenzen disponible.')).not.toBeInTheDocument();
});
