/**
 * El 404: no pide sesión de Strava y siempre deja una salida.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import NotFound from '@/components/NotFound';

it('dice que la página no existe y ofrece volver al inicio', () => {
  render(<NotFound />);
  expect(screen.getByRole('heading', { name: 'Este camino no existe' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
});

it('la foto tiene texto alternativo: el cartel es parte del mensaje', () => {
  render(<NotFound />);
  expect(screen.getByRole('img', { name: /cartel amarillo/ })).toBeInTheDocument();
});
