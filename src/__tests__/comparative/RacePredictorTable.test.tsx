/**
 * Tabla de predicciones de la tab Comparar. Muestra dos columnas que es
 * importante no confundir: "Mejor marca" es una proyección de una salida real
 * de los últimos 12 meses, y "Proyección" es la fórmula de Riegel. La nota al
 * pie explica esa diferencia, y por eso se verifica que esté.
 *
 * Sin ningún dato el componente no se renderiza: una tabla de guiones no le
 * aporta nada al corredor.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import RacePredictorTable from '@/components/RacePredictorTable';
import { activity } from '@/__tests__/helpers/activity';
import { StravaActivity } from '@/types/strava';

const NOW = new Date('2026-07-15T12:00:00Z');

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

function runDaysAgo(days: number, over: Partial<StravaActivity> = {}, id = 1): StravaActivity {
  const iso = new Date(NOW.getTime() - days * 86400000).toISOString();
  return activity({
    id,
    distance: 10000,
    moving_time: 3000,
    start_date: iso,
    start_date_local: iso,
    ...over,
  });
}

describe('cuándo no se muestra', () => {
  it('no renderiza nada sin actividades', () => {
    const { container } = render(<RacePredictorTable activities={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('no renderiza nada si todo es de hace más de 12 meses', () => {
    const { container } = render(<RacePredictorTable activities={[runDaysAgo(400)]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('no renderiza nada si no hay corridas', () => {
    const { container } = render(
      <RacePredictorTable activities={[runDaysAgo(5, { sport_type: 'Ride', type: 'Ride' })]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('estructura', () => {
  beforeEach(() => {
    render(<RacePredictorTable activities={[runDaysAgo(5, { distance: 10000, moving_time: 3000 })]} />);
  });

  it('se titula Predicciones', () => {
    expect(screen.getByText('Predicciones')).toBeInTheDocument();
  });

  it('encabeza con distancia, mejor marca y proyección', () => {
    expect(screen.getByText('Distancia')).toBeInTheDocument();
    expect(screen.getByText('Mejor marca')).toBeInTheDocument();
    expect(screen.getByText('Proyección')).toBeInTheDocument();
  });

  it('lista las seis distancias de carrera', () => {
    for (const label of ['5 km', '10 km', '15 km', '21,0975 km', '31.5 km', '42,195 km']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('explica al pie la diferencia entre las dos columnas', () => {
    const nota = screen.getByText(/Mejor marca:/);

    expect(nota.textContent).toContain('últimos 12 meses');
    expect(nota.textContent).toContain('Riegel');
  });
});

describe('mejor marca', () => {
  it('muestra el tiempo proyectado con su fecha', () => {
    render(<RacePredictorTable activities={[runDaysAgo(5, { distance: 10000, moving_time: 3000 })]} />);

    // 10 km en 3000 s proyectan 25:00 a 5 km.
    expect(screen.getByText('25:00')).toBeInTheDocument();
    // La misma salida fecha la marca de 5K y la de 10K.
    expect(screen.getAllByText('10 jul 2026').length).toBeGreaterThan(0);
  });

  it('muestra guión en las distancias que nunca se acercó a correr', () => {
    render(<RacePredictorTable activities={[runDaysAgo(5, { distance: 5000, moving_time: 1500 })]} />);

    // Sin salidas largas, la maratón queda sin marca.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('usa formato con horas en las distancias largas', () => {
    render(<RacePredictorTable activities={[runDaysAgo(5, { distance: 42195, moving_time: 14400 })]} />);

    // La marca de maratón y su proyección de Riegel coinciden en la referencia.
    expect(screen.getAllByText('4:00:00').length).toBeGreaterThan(0);
  });
});

describe('proyección de Riegel', () => {
  it('se muestra en todas las distancias cuando hay una referencia', () => {
    render(<RacePredictorTable activities={[runDaysAgo(5, { distance: 10000, moving_time: 3000 })]} />);

    // La referencia proyecta a las seis distancias, incluso a las no corridas.
    expect(screen.getByText('42,195 km')).toBeInTheDocument();
    expect(screen.queryAllByText('—').length).toBeLessThan(12);
  });

  it('sin una salida de 5 km no hay con qué anclar', () => {
    render(<RacePredictorTable activities={[runDaysAgo(5, { distance: 4000, moving_time: 1200 })]} />);

    // La columna de proyección queda vacía en las seis filas.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(6);
  });
});
