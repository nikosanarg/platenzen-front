/**
 * El alta al club y la publicación automática. El cliente HTTP se mockea (es
 * el borde de red); lo que se prueba es lo que la persona ve y lo que se
 * manda: sin aceptar los acuerdos no hay alta, un nombre tomado se explica, y
 * una vez adentro sus números se publican solos.
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ClubProvider } from '@/hooks/useClub';
import PerfilClub from '@/components/PerfilClub';
import { computeStats } from '@/lib/stats';
import { activity } from '@/__tests__/helpers/activity';
import * as cliente from '@/lib/club/cliente';

jest.mock('@/lib/club/cliente', () => {
  const real = jest.requireActual('@/lib/club/cliente');
  return {
    ...real,
    miPerfil: jest.fn(),
    registrarse: jest.fn(),
    actualizarPerfil: jest.fn(),
    aceptarAcuerdos: jest.fn(),
    borrarCuenta: jest.fn(),
    publicar: jest.fn(),
  };
});

const api = cliente as jest.Mocked<typeof cliente>;

const PERFIL: cliente.MiPerfil = {
  id: '7b7c3d0e-1111-4222-8333-444455556666',
  alias: 'pepino357619',
  usuario: null,
  enlace: 'pepino357619',
  nombre: 'pepino357619',
  nombreVisible: null,
  pais: null,
  visibilidad: 'publica',
  acuerdosVersion: '2026-10-04',
  acuerdosVigentes: '2026-10-04',
  publicadaAt: null,
};

const ACTS = [activity({ id: 1, start_date_local: '2026-07-10T07:00:00Z' })];
const obtenerToken = async () => 'tok';

function renderPerfil() {
  return render(
    <ClubProvider obtenerToken={obtenerToken} datosListos activities={ACTS} stats={computeStats(ACTS)}>
      <PerfilClub />
    </ClubProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  api.publicar.mockResolvedValue(undefined);
});

it('a quien no está registrado le ofrece el alta y le cuenta qué se publica', async () => {
  api.miPerfil.mockResolvedValue(null);
  renderPerfil();
  expect(await screen.findByText('Sumate al ranking del club')).toBeInTheDocument();
  expect(screen.getByText(/ni el nombre de tus salidas/)).toBeInTheDocument();
  expect(api.publicar).not.toHaveBeenCalled();
});

it('sin aceptar los acuerdos el alta no se puede enviar', async () => {
  api.miPerfil.mockResolvedValue(null);
  renderPerfil();
  const boton = await screen.findByRole('button', { name: 'Sumarme' });
  expect(boton).toBeDisabled();

  fireEvent.click(screen.getByRole('checkbox'));
  expect(boton).toBeEnabled();
});

it('al sumarse manda el perfil elegido y después publica sus números solo', async () => {
  api.miPerfil.mockResolvedValue(null);
  api.registrarse.mockResolvedValue({ ...PERFIL, nombreVisible: 'Ana', nombre: 'Ana', pais: 'AR' });
  renderPerfil();

  fireEvent.change(await screen.findByLabelText('Usuario'), { target: { value: ' @NSande ' } });
  fireEvent.change(screen.getByLabelText('Nombre visible'), { target: { value: '  Ana ' } });
  fireEvent.change(screen.getByLabelText('País'), { target: { value: 'AR' } });
  fireEvent.click(screen.getByRole('radio', { name: /Sólo en el ranking/ }));
  fireEvent.click(screen.getByRole('checkbox'));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Sumarme' }));
  });

  expect(api.registrarse).toHaveBeenCalledWith(
    { usuario: 'nsande', nombreVisible: 'Ana', pais: 'AR', visibilidad: 'solo_ranking' },
    obtenerToken
  );
  expect(await screen.findByText('Perfil del club')).toBeInTheDocument();
  await waitFor(() => expect(api.publicar).toHaveBeenCalledTimes(1));
  const [publicacion] = api.publicar.mock.calls[0];
  expect(publicacion.ficha.nombre).toBeNull();
  expect(publicacion.semanasActivas).toContain('2026-07-06');
});

it('un nombre tomado se explica, no se traga', async () => {
  api.miPerfil.mockResolvedValue(null);
  api.registrarse.mockRejectedValue(new cliente.ErrorClub('NOMBRE_EN_USO', 409));
  renderPerfil();

  fireEvent.change(await screen.findByLabelText('Nombre visible'), { target: { value: 'Ana' } });
  fireEvent.click(screen.getByRole('checkbox'));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Sumarme' }));
  });

  expect(screen.getByRole('alert')).toHaveTextContent('Ese nombre ya lo eligió otro corredor.');
});

it('un usuario tomado se explica', async () => {
  api.miPerfil.mockResolvedValue(null);
  api.registrarse.mockRejectedValue(new cliente.ErrorClub('USUARIO_EN_USO', 409));
  renderPerfil();

  fireEvent.change(await screen.findByLabelText('Usuario'), { target: { value: 'nsande' } });
  fireEvent.click(screen.getByRole('checkbox'));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Sumarme' }));
  });

  expect(screen.getByRole('alert')).toHaveTextContent('Ese usuario ya lo eligió otro corredor.');
});

it('registrado, muestra el link público con su usuario', async () => {
  api.miPerfil.mockResolvedValue({ ...PERFIL, usuario: 'nsande', enlace: 'nsande' });
  renderPerfil();
  expect(await screen.findByRole('link', { name: 'platenzen.com/hero/nsande' })).toHaveAttribute('href', '/hero/nsande');
});

it('con los acuerdos desactualizados no publica hasta que los acepte', async () => {
  api.miPerfil.mockResolvedValue({ ...PERFIL, acuerdosVersion: '2026-01-01' });
  api.aceptarAcuerdos.mockResolvedValue(PERFIL);
  renderPerfil();

  expect(await screen.findByText(/Los acuerdos del club cambiaron/)).toBeInTheDocument();
  expect(api.publicar).not.toHaveBeenCalled();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Acepto los acuerdos nuevos' }));
  });
  await waitFor(() => expect(api.publicar).toHaveBeenCalledTimes(1));
});

it('sin el club configurado lo dice y no ofrece nada', async () => {
  api.miPerfil.mockRejectedValue(new cliente.ErrorClub('CLUB_NO_DISPONIBLE', 503));
  renderPerfil();
  expect(await screen.findByText(/El club no está disponible/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Sumarme' })).not.toBeInTheDocument();
});

it('dejar el club pide confirmación y vuelve a ofrecer el alta', async () => {
  api.miPerfil.mockResolvedValue(PERFIL);
  api.borrarCuenta.mockResolvedValue(undefined);
  renderPerfil();

  fireEvent.click(await screen.findByRole('button', { name: 'Dejar el club' }));
  expect(api.borrarCuenta).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Borrar todo' }));
  });

  expect(api.borrarCuenta).toHaveBeenCalled();
  expect(await screen.findByText('Sumate al ranking del club')).toBeInTheDocument();
});
