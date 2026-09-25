/**
 * La tab Mapa: lista de lugares con nombre, detalle con historia (primera y
 * última visita, salida más larga, tendencia de ritmo) y navegación entre
 * los dos. Los recorridos y la interacción de arrastre/zoom del SVG no se
 * cubren acá — dependen de medidas de layout que jsdom no da (`getBoundingClientRect`
 * siempre 0), y no son lógica de dominio.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import TuMundo from '@/components/TuMundo';
import { activity } from '@/__tests__/helpers/activity';
import { encodePolyline } from '@/lib/polylineEncoder';
import { Activity } from '@/types/activity';

// Sin esto, `useLugares` dispara un `fetch` real (indefinido en jsdom). Se
// resuelve a `null` — el fallback "Lugar #n" es determinístico y no depende
// de red, que es lo que estos tests necesitan.
jest.mock('@/services/geocoding/nominatim', () => ({
  getPlaceName: jest.fn().mockResolvedValue(null),
}));

function polylineAt(lat: number, lon: number): string {
  return encodePolyline([
    [lat, lon],
    [lat + 0.0005, lon + 0.0005],
  ]);
}

function salidaEn(id: number, lat: number, lon: number, overrides: Partial<Activity> = {}): Activity {
  return activity({
    id,
    name: `Salida ${id}`,
    map: { summary_polyline: polylineAt(lat, lon) },
    ...overrides,
  });
}

/** `n` salidas en el mismo lugar, en días consecutivos, para poblar el detalle. */
function salidasEnElMismoLugar(n: number, lat: number, lon: number): Activity[] {
  return Array.from({ length: n }, (_, i) =>
    salidaEn(i + 1, lat, lon, {
      distance: (i + 1) * 1000,
      start_date_local: `2026-0${(i % 9) + 1}-1${i % 9}T08:00:00Z`,
    })
  );
}

function sidebar() {
  return screen.getByRole('region', { name: 'Lugares del mapa' });
}

describe('Tu Mundo', () => {
  it('sin actividades con recorrido, muestra el estado vacío', () => {
    render(<TuMundo activities={[]} />);

    expect(
      screen.getByText('Necesitás actividades con recorrido registrado para ver tu mundo.')
    ).toBeInTheDocument();
  });

  it('lista los lugares por ranking de visitas, con el fallback numerado', async () => {
    const activities = [
      ...salidasEnElMismoLugar(3, -34.9214, -57.9544), // La Plata, 3 salidas
      salidaEn(10, -34.6037, -58.3816), // CABA, 1 salida
    ];
    render(<TuMundo activities={activities} />);

    const filas = await within(sidebar()).findAllByRole('button', { name: /Lugar #\d/ });
    expect(filas).toHaveLength(2);
    expect(filas[0]).toHaveTextContent('Lugar #1');
    expect(filas[0]).toHaveTextContent('3×');
    expect(filas[1]).toHaveTextContent('Lugar #2');
    expect(filas[1]).toHaveTextContent('1×');
  });

  it('elegir un lugar de la lista muestra su detalle', async () => {
    const activities = salidasEnElMismoLugar(3, -34.9214, -57.9544);
    render(<TuMundo activities={activities} />);

    const fila = await within(sidebar()).findByRole('button', { name: /Lugar #1/ });
    fireEvent.click(fila);

    expect(within(sidebar()).getByRole('button', { name: 'Lugares' })).toBeInTheDocument();
    expect(within(sidebar()).getByText('Lugar #1')).toBeInTheDocument();
    expect(within(sidebar()).getByText('Entrenamientos')).toBeInTheDocument();
    expect(within(sidebar()).getByText('3')).toBeInTheDocument();
    expect(within(sidebar()).getByText('Distancia acumulada')).toBeInTheDocument();
    expect(within(sidebar()).getByText('Mejor ritmo')).toBeInTheDocument();
    expect(within(sidebar()).getByText('Primera visita')).toBeInTheDocument();
    expect(within(sidebar()).getByText('Última visita')).toBeInTheDocument();
    expect(within(sidebar()).getByText('Salida más larga')).toBeInTheDocument();
  });

  it('el botón "Lugares" vuelve de un detalle a la lista', async () => {
    const activities = salidasEnElMismoLugar(3, -34.9214, -57.9544);
    render(<TuMundo activities={activities} />);

    fireEvent.click(await within(sidebar()).findByRole('button', { name: /Lugar #1/ }));
    fireEvent.click(within(sidebar()).getByRole('button', { name: 'Lugares' }));

    expect(within(sidebar()).getByRole('button', { name: /Lugar #1/ })).toBeInTheDocument();
    expect(within(sidebar()).queryByText('Entrenamientos')).not.toBeInTheDocument();
  });

  it('con menos de 6 salidas en el lugar, no hay tendencia de ritmo', async () => {
    const activities = salidasEnElMismoLugar(5, -34.9214, -57.9544);
    render(<TuMundo activities={activities} />);

    fireEvent.click(await within(sidebar()).findByRole('button', { name: /Lugar #1/ }));

    expect(within(sidebar()).queryByText(/Ritmo acá/)).not.toBeInTheDocument();
  });

  it('con 6 salidas o más, muestra la tendencia de ritmo del lugar', async () => {
    const activities = salidasEnElMismoLugar(6, -34.9214, -57.9544);
    render(<TuMundo activities={activities} />);

    fireEvent.click(await within(sidebar()).findByRole('button', { name: /Lugar #1/ }));

    expect(within(sidebar()).getByText(/Ritmo acá/)).toBeInTheDocument();
  });

  it('tocar una salida del detalle la marca como elegida, y tocarla de nuevo la suelta', async () => {
    const activities = salidasEnElMismoLugar(3, -34.9214, -57.9544);
    render(<TuMundo activities={activities} />);

    fireEvent.click(await within(sidebar()).findByRole('button', { name: /Lugar #1/ }));
    const salida = within(sidebar()).getByRole('button', { name: /Salida 3/ });

    expect(salida).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(salida);
    expect(salida).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(salida);
    expect(salida).toHaveAttribute('aria-pressed', 'false');
  });

  it('con más de 10 salidas en el lugar, sólo muestra las 10 más recientes hasta pedir "ver todas"', async () => {
    const activities = salidasEnElMismoLugar(12, -34.9214, -57.9544);
    render(<TuMundo activities={activities} />);

    fireEvent.click(await within(sidebar()).findByRole('button', { name: /Lugar #1/ }));

    expect(within(sidebar()).getAllByRole('button', { name: /Salida \d+/ })).toHaveLength(10);
    const verTodas = within(sidebar()).getByRole('button', { name: /Ver las 12 salidas/ });

    fireEvent.click(verTodas);

    expect(within(sidebar()).getAllByRole('button', { name: /Salida \d+/ })).toHaveLength(12);
    expect(within(sidebar()).queryByRole('button', { name: /Ver las/ })).not.toBeInTheDocument();
  });

  it('ordenar por Km, no por Salidas, cambia el orden de la lista', async () => {
    const activities = [
      // La Plata: muchas salidas cortas — gana en visitas.
      ...salidasEnElMismoLugar(5, -34.9214, -57.9544).map(a => ({ ...a, distance: 3000 })),
      // CABA: pocas salidas largas — gana en kilómetros.
      salidaEn(20, -34.6037, -58.3816, { distance: 20000 }),
      salidaEn(21, -34.6037, -58.3816, { distance: 20000 }),
    ];
    render(<TuMundo activities={activities} />);

    let filas = await within(sidebar()).findAllByRole('button', { name: /Lugar #\d/ });
    expect(filas[0]).toHaveTextContent('5×'); // por visitas, La Plata primero

    fireEvent.click(within(sidebar()).getByRole('button', { name: 'Km' }));

    filas = within(sidebar()).getAllByRole('button', { name: /Lugar #\d/ });
    expect(filas[0]).toHaveTextContent('2×'); // por km, CABA primero (40 km > 15 km)
  });

  it('preseleccionar un lugar por id muestra su detalle de entrada', async () => {
    const activities = salidasEnElMismoLugar(3, -34.9214, -57.9544);

    // El id de un lugar es el de su única celda de grilla: se reconstruye con
    // la misma fórmula que `worldMap.ts` (celdas de 0.01°).
    const cLat = Math.floor(-34.9214 / 0.01);
    const cLon = Math.floor(-57.9544 / 0.01);
    const id = `${cLat},${cLon}`;

    render(<TuMundo activities={activities} initialClusterId={id} />);

    expect(await within(sidebar()).findByRole('button', { name: 'Lugares' })).toBeInTheDocument();
    expect(within(sidebar()).getByText('Entrenamientos')).toBeInTheDocument();
  });
});
