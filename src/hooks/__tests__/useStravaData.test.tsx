/**
 * El contexto que sostiene los datos entre las tres rutas del dashboard. Lo que
 * importa verificar es que falle ruidosamente cuando falta el provider: si
 * devolviera datos vacíos, una página fuera del layout mostraría un dashboard en
 * cero en lugar de avisar que está mal montada.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StravaDataProvider, useStravaData } from '@/hooks/useStravaData';
import { computeStats } from '@/lib/stats';
import { activity } from '@/__tests__/helpers/activity';

function Consumidor() {
  const { activities, stats } = useStravaData();
  return (
    <div>
      <span data-testid="count">{activities.length}</span>
      <span data-testid="km">{stats.totalDistance}</span>
    </div>
  );
}

describe('useStravaData', () => {
  it('entrega las actividades y las stats provistas', () => {
    const activities = [activity({ distance: 10000, moving_time: 3000 })];

    render(
      <StravaDataProvider value={{ activities, stats: computeStats(activities) }}>
        <Consumidor />
      </StravaDataProvider>,
    );

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('km')).toHaveTextContent('10');
  });

  it('funciona con el historial vacío', () => {
    render(
      <StravaDataProvider value={{ activities: [], stats: computeStats([]) }}>
        <Consumidor />
      </StravaDataProvider>,
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('lanza error si se usa sin provider', () => {
    // React loguea el error de render; se silencia para no ensuciar la salida.
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Consumidor />)).toThrow(/StravaDataProvider/);

    consoleError.mockRestore();
  });
});
