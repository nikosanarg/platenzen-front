/**
 * La lista de lugares más frecuentados. Tocar un lugar navega a la tab Mapa
 * ya centrada y seleccionada ahí (`/mapa?lugar=<id>`) — el mapa completo, no
 * uno chico embebido en un modal.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import LugaresFrecuentados from '@/components/LugaresFrecuentados';
import { activity } from '@/__tests__/helpers/activity';
import { encodePolyline } from '@/lib/polylineEncoder';
import { Activity } from '@/types/activity';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

// Sin esto, `useLugares` dispara un `fetch` real (indefinido en jsdom) para
// cada lugar. Se resuelve a `null` — el fallback "Lugar #n" es justo lo que
// estos tests necesitan, porque es determinístico y no depende de red.
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

beforeEach(() => {
  push.mockClear();
});

describe('lugares más frecuentados', () => {
  it('no renderiza nada sin actividades con recorrido', () => {
    const { container } = render(<LugaresFrecuentados activities={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('tocar un lugar navega al mapa ya centrado y seleccionado en ese lugar', async () => {
    const activities = [
      salidaEn(1, -34.9214, -57.9544),
      salidaEn(2, -34.9214, -57.9544),
      salidaEn(3, -34.9214, -57.9544),
    ];
    render(<LugaresFrecuentados activities={activities} />);

    // Sin nombre resuelto (mockeado a null), el fallback numerado por ranking.
    const item = await screen.findByRole('button', { name: /Lugar #1/ });
    // Las tres salidas cayeron en el mismo lugar: la ficha lo cuenta.
    expect(item).toHaveTextContent('3×');

    fireEvent.click(item);

    expect(push).toHaveBeenCalledTimes(1);
    expect(push.mock.calls[0][0]).toMatch(/^\/mapa\?lugar=/);
  });

  it('muestra sólo el top 3, con link a la tab Mapa', async () => {
    // Cuatro ciudades bien separadas: cada una es su propio lugar, no se agrupan.
    const activities = [
      salidaEn(1, -34.9214, -57.9544), // La Plata
      salidaEn(2, -34.6037, -58.3816), // CABA
      salidaEn(3, -31.4201, -64.1888), // Córdoba
      salidaEn(4, -32.9442, -60.6505), // Rosario
    ];
    render(<LugaresFrecuentados activities={activities} />);

    expect(await screen.findAllByRole('button', { name: /Lugar #\d/ })).toHaveLength(3);
    expect(screen.getByRole('link', { name: /Ver más/ })).toHaveAttribute('href', '/mapa');
  });

  it('el link a la tab Mapa se ofrece también con pocos lugares', async () => {
    const activities = [salidaEn(1, -34.90, -57.90), salidaEn(2, -34.90, -57.90)];
    render(<LugaresFrecuentados activities={activities} />);

    await screen.findByRole('button', { name: /Lugar #1/ });
    expect(screen.getByRole('link', { name: /Ver más/ })).toHaveAttribute('href', '/mapa');
  });

  it('la fila muestra ritmo, última visita, la salida más larga y los km acumulados', async () => {
    const activities = [
      salidaEn(1, -34.9214, -57.9544, {
        distance: 8000,
        start_date_local: '2026-05-10T08:00:00Z',
      }),
      salidaEn(2, -34.9214, -57.9544, {
        distance: 21100,
        start_date_local: '2026-06-15T08:00:00Z',
      }),
    ];
    render(<LugaresFrecuentados activities={activities} />);
    const item = await screen.findByRole('button', { name: /Lugar #1/ });

    // Ritmo · última visita, en la primera fila...
    expect(item).toHaveTextContent(/\d:\d\d\/km/);
    // ...la salida más larga (21.1 km) con su fecha, no la más reciente ni la primera...
    expect(item).toHaveTextContent('21.1 km · 15 jun 2026');
    // ...y los km acumulados del lugar, en la columna de valores.
    expect(item).toHaveTextContent('29.1 km');
  });
});
