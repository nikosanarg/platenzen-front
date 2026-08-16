/**
 * Panel de períodos de la tab Comparar. Muestra seis métricas comparando el
 * período actual contra el anterior, y cierra con una conclusión en prosa.
 *
 * Lo delicado es el signo: en todas las filas un delta positivo es una mejora,
 * salvo en el ritmo, donde el número que baja es el que mejora. Ese caso se
 * muestra en segundos, no en porcentaje, y con el signo invertido respecto al
 * cálculo crudo.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import PeriodComparator from '@/components/PeriodComparator';
import { activity } from '@/__tests__/helpers/activity';
import { Activity } from '@/types/activity';

const NOW = new Date('2026-07-15T12:00:00Z');

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

function runDaysAgo(days: number, over: Partial<Activity> = {}, id = 1): Activity {
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

/** Fila de la tabla por nombre de métrica: [anterior, actual, cambio]. */
function fila(nombre: string): string[] {
  const celda = screen.getByText(nombre);
  const row = celda.parentElement!;
  return Array.from(row.children).map((c) => c.textContent ?? '');
}

describe('estructura de la tabla', () => {
  beforeEach(() => {
    render(<PeriodComparator activities={[runDaysAgo(5)]} />);
  });

  it('encabeza con métrica, comparación y cambio', () => {
    expect(screen.getByText('Métrica')).toBeInTheDocument();
    expect(screen.getByText('Antes vs. Ahora')).toBeInTheDocument();
    expect(screen.getByText('Cambio')).toBeInTheDocument();
  });

  it('muestra las seis métricas', () => {
    for (const nombre of [
      'Distancia',
      'Actividades',
      'Ritmo prom.',
      'Tiempo total',
      'Tiempo / actividad',
      'Distancia / actividad',
    ]) {
      expect(screen.getByText(nombre)).toBeInTheDocument();
    }
  });

  it('ofrece los tres períodos', () => {
    expect(screen.getByText('30 días')).toBeInTheDocument();
    expect(screen.getByText('90 días')).toBeInTheDocument();
    expect(screen.getByText('Este año')).toBeInTheDocument();
  });
});

describe('Distancia / actividad', () => {
  it('divide la distancia del período por su cantidad de actividades', () => {
    // 3 salidas de 10 km en los últimos 30 días → 10.0 km por actividad.
    render(
      <PeriodComparator
        activities={[
          runDaysAgo(2, { distance: 10000 }, 1),
          runDaysAgo(5, { distance: 10000 }, 2),
          runDaysAgo(9, { distance: 10000 }, 3),
        ]}
      />,
    );

    const [, comparacion] = fila('Distancia / actividad');
    expect(comparacion).toContain('10 km');
  });

  it('distingue el promedio del total: 3 salidas de 5 km no son 15 km por salida', () => {
    render(
      <PeriodComparator
        activities={[
          runDaysAgo(2, { distance: 5000 }, 1),
          runDaysAgo(5, { distance: 5000 }, 2),
          runDaysAgo(9, { distance: 5000 }, 3),
        ]}
      />,
    );

    const [, comparacion] = fila('Distancia / actividad');
    expect(comparacion).toContain('5 km');
    expect(comparacion).not.toContain('15 km');
  });

  it('detecta salidas más largas aunque el volumen total baje', () => {
    render(
      <PeriodComparator
        activities={[
          // Período actual: 2 salidas de 12 km = 24 km, 12 km/salida.
          runDaysAgo(5, { distance: 12000 }, 1),
          runDaysAgo(10, { distance: 12000 }, 2),
          // Período anterior: 5 salidas de 6 km = 30 km, 6 km/salida.
          runDaysAgo(35, { distance: 6000 }, 3),
          runDaysAgo(38, { distance: 6000 }, 4),
          runDaysAgo(41, { distance: 6000 }, 5),
          runDaysAgo(44, { distance: 6000 }, 6),
          runDaysAgo(47, { distance: 6000 }, 7),
        ]}
      />,
    );

    const [, , cambio] = fila('Distancia / actividad');
    expect(cambio).toBe('+100%');

    // El volumen total bajó, pero cada salida fue el doble de larga.
    const [, , cambioDistancia] = fila('Distancia');
    expect(cambioDistancia).toBe('-20%');
  });

  it('muestra guión cuando el período anterior no tuvo actividades', () => {
    render(<PeriodComparator activities={[runDaysAgo(5)]} />);

    const [, , cambio] = fila('Distancia / actividad');
    expect(cambio).toBe('—');
  });

  it('vale 0 km cuando el período está vacío', () => {
    render(<PeriodComparator activities={[]} />);

    const [, comparacion] = fila('Distancia / actividad');
    expect(comparacion).toContain('0 km');
  });
});

describe('formato del cambio', () => {
  it('agrega el signo + cuando la métrica subió', () => {
    render(
      <PeriodComparator
        activities={[
          runDaysAgo(5, { distance: 20000 }, 1),
          runDaysAgo(40, { distance: 10000 }, 2),
        ]}
      />,
    );

    expect(fila('Distancia')[2]).toBe('+100%');
  });

  it('el ritmo se expresa en segundos, no en porcentaje', () => {
    render(
      <PeriodComparator
        activities={[
          runDaysAgo(5, { distance: 10000, moving_time: 3000 }, 1),
          runDaysAgo(40, { distance: 10000, moving_time: 3300 }, 2),
        ]}
      />,
    );

    expect(fila('Ritmo prom.')[2]).toBe('+30"');
  });

  it('el ritmo que empeora se marca con el signo menos', () => {
    render(
      <PeriodComparator
        activities={[
          runDaysAgo(5, { distance: 10000, moving_time: 3300 }, 1),
          runDaysAgo(40, { distance: 10000, moving_time: 3000 }, 2),
        ]}
      />,
    );

    expect(fila('Ritmo prom.')[2]).toBe('−30"');
  });

  it('el ritmo sin cambio se marca con un igual', () => {
    render(
      <PeriodComparator
        activities={[
          runDaysAgo(5, { distance: 10000, moving_time: 3000 }, 1),
          runDaysAgo(40, { distance: 10000, moving_time: 3000 }, 2),
        ]}
      />,
    );

    expect(fila('Ritmo prom.')[2]).toBe('=');
  });

  it('muestra guión cuando falta uno de los dos ritmos', () => {
    render(<PeriodComparator activities={[runDaysAgo(5)]} />);
    expect(fila('Ritmo prom.')[2]).toBe('—');
  });
});

describe('cambio de período', () => {
  it('arranca en 30 días', () => {
    render(<PeriodComparator activities={[runDaysAgo(5)]} />);
    expect(fila('Actividades')[1]).toContain('1');
  });

  it('al elegir 90 días recalcula las filas', () => {
    render(
      <PeriodComparator
        activities={[
          runDaysAgo(5, {}, 1),
          runDaysAgo(60, {}, 2),
          runDaysAgo(80, {}, 3),
        ]}
      />,
    );

    expect(fila('Actividades')[1]).toContain('1');

    fireEvent.click(screen.getByText('90 días'));
    expect(fila('Actividades')[1]).toContain('3');
  });

  it('al elegir el año recalcula de nuevo', () => {
    render(
      <PeriodComparator
        activities={[runDaysAgo(5, {}, 1), runDaysAgo(150, {}, 2)]}
      />,
    );

    fireEvent.click(screen.getByText('Este año'));
    expect(fila('Actividades')[1]).toContain('2');
  });
});

describe('conclusión', () => {
  it('no concluye nada si no hay período anterior con qué comparar', () => {
    const { container } = render(<PeriodComparator activities={[runDaysAgo(5)]} />);
    expect(container.textContent).not.toContain('período anterior');
  });

  it('destaca el aumento de volumen a partir del 15%', () => {
    render(
      <PeriodComparator
        activities={[
          runDaysAgo(5, { distance: 20000 }, 1),
          runDaysAgo(40, { distance: 10000 }, 2),
        ]}
      />,
    );

    expect(screen.getByText(/Corriste un 100% más de distancia/)).toBeInTheDocument();
  });

  it('informa la caída de volumen a partir del -15%', () => {
    render(
      <PeriodComparator
        activities={[
          runDaysAgo(5, { distance: 5000 }, 1),
          runDaysAgo(40, { distance: 20000 }, 2),
        ]}
      />,
    );

    expect(screen.getByText(/Corriste un 75% menos de distancia/)).toBeInTheDocument();
  });

  it('reconoce la mejora leve sin exagerarla', () => {
    render(
      <PeriodComparator
        activities={[
          runDaysAgo(5, { distance: 11000 }, 1),
          runDaysAgo(40, { distance: 10000 }, 2),
        ]}
      />,
    );

    expect(screen.getByText(/volumen similar al período anterior con una leve mejora/)).toBeInTheDocument();
  });

  it('interpreta misma distancia en menos salidas como salidas más largas', () => {
    render(
      <PeriodComparator
        activities={[
          // Actual: 2 salidas, 20 km.
          runDaysAgo(5, { distance: 10000 }, 1),
          runDaysAgo(10, { distance: 10000 }, 2),
          // Anterior: 4 salidas, 20 km.
          runDaysAgo(35, { distance: 5000 }, 3),
          runDaysAgo(38, { distance: 5000 }, 4),
          runDaysAgo(41, { distance: 5000 }, 5),
          runDaysAgo(44, { distance: 5000 }, 6),
        ]}
      />,
    );

    expect(screen.getByText(/salidas más largas/)).toBeInTheDocument();
  });

  it('menciona el cambio de ritmo cuando supera los 5 segundos', () => {
    render(
      <PeriodComparator
        activities={[
          runDaysAgo(5, { distance: 20000, moving_time: 6000 }, 1),
          runDaysAgo(40, { distance: 10000, moving_time: 3300 }, 2),
        ]}
      />,
    );

    expect(screen.getByText(/Tu ritmo promedio mejoró 30 segundos\/km/)).toBeInTheDocument();
  });

  it('también informa cuando el ritmo bajó', () => {
    render(
      <PeriodComparator
        activities={[
          runDaysAgo(5, { distance: 20000, moving_time: 6600 }, 1),
          runDaysAgo(40, { distance: 10000, moving_time: 3000 }, 2),
        ]}
      />,
    );

    expect(screen.getByText(/Tu ritmo promedio bajó 30 segundos\/km/)).toBeInTheDocument();
  });

  it('interpreta más salidas con menos volumen como entrenamientos más cortos', () => {
    render(
      <PeriodComparator
        activities={[
          // Actual: 4 salidas, 20 km.
          runDaysAgo(2, { distance: 5000 }, 1),
          runDaysAgo(5, { distance: 5000 }, 2),
          runDaysAgo(8, { distance: 5000 }, 3),
          runDaysAgo(11, { distance: 5000 }, 4),
          // Anterior: 1 salida, 20 km.
          runDaysAgo(40, { distance: 20000 }, 5),
        ]}
      />,
    );

    expect(screen.getByText(/entrenamientos más cortos/)).toBeInTheDocument();
  });

  it('mantiene el tono factual: sin signos de exclamación', () => {
    const { container } = render(
      <PeriodComparator
        activities={[
          runDaysAgo(5, { distance: 20000 }, 1),
          runDaysAgo(40, { distance: 10000 }, 2),
        ]}
      />,
    );

    expect(container.textContent).not.toMatch(/[!¡]/);
  });
});

describe('estado vacío', () => {
  it('renderiza la tabla con ceros en lugar de romperse', () => {
    render(<PeriodComparator activities={[]} />);

    const distancia = screen.getByText('Distancia').parentElement!;
    expect(within(distancia).getByText('vs.')).toBeInTheDocument();
    expect(fila('Distancia')[2]).toBe('—');
  });
});
