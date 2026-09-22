/**
 * La lista de lugares más frecuentados y su modal. Tocar un lugar abre el
 * mapa grande de "Tu Mundo" —ya centrado y seleccionado en ese lugar, sin un
 * segundo click sobre el mapa— y se puede cerrar con el botón o con Escape.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import LugaresFrecuentados from '@/components/LugaresFrecuentados';
import { activity } from '@/__tests__/helpers/activity';
import { Activity } from '@/types/activity';

/** Polyline de un solo punto en el lat/lon dado, para fijar el arranque. */
function polylineAt(lat: number, lon: number): string {
  const encode = (value: number) => {
    let v = Math.round(value * 1e5) << 1;
    if (v < 0) v = ~v;
    let out = '';
    while (v >= 0x20) {
      out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    return out + String.fromCharCode(v + 63);
  };
  return encode(lat) + encode(lon);
}

function salidaEn(id: number, lat: number, lon: number, overrides: Partial<Activity> = {}): Activity {
  return activity({
    id,
    name: `Salida ${id}`,
    map: { summary_polyline: polylineAt(lat, lon) },
    ...overrides,
  });
}

describe('lugares más frecuentados', () => {
  it('no renderiza nada sin actividades con recorrido', () => {
    const { container } = render(<LugaresFrecuentados activities={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('tocar un lugar abre el mapa de Tu Mundo ya centrado en ese lugar, y se puede cerrar', () => {
    const activities = [
      salidaEn(1, -34.9214, -57.9544),
      salidaEn(2, -34.9214, -57.9544),
      salidaEn(3, -34.9214, -57.9544),
    ];
    render(<LugaresFrecuentados activities={activities} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /km acumulados/ }));

    const modal = screen.getByRole('dialog', { name: 'Tu Mundo' });
    expect(modal).toBeInTheDocument();
    // No hace falta un segundo click sobre el mapa: el lugar llega preseleccionado.
    expect(screen.getByText('Detalle de zona')).toBeInTheDocument();
    // Las tres salidas cayeron en el mismo lugar: la ficha lo cuenta.
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Entrenamientos')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra sólo el top 3 y un link a la tab Mapa cuando hay más lugares', () => {
    // Cuatro ciudades bien separadas: cada una es su propio lugar, no se agrupan.
    const activities = [
      salidaEn(1, -34.9214, -57.9544), // La Plata
      salidaEn(2, -34.6037, -58.3816), // CABA
      salidaEn(3, -31.4201, -64.1888), // Córdoba
      salidaEn(4, -32.9442, -60.6505), // Rosario
    ];
    render(<LugaresFrecuentados activities={activities} />);

    expect(screen.getAllByRole('button', { name: /km acumulados/ })).toHaveLength(3);
    const link = screen.getByRole('link', { name: /Ver más/ });
    expect(link).toHaveAttribute('href', '/mapa');
  });

  it('sin lugares de más, no ofrece el link a la tab Mapa', () => {
    const activities = [salidaEn(1, -34.90, -57.90), salidaEn(2, -34.90, -57.90)];
    render(<LugaresFrecuentados activities={activities} />);

    expect(screen.queryByRole('link', { name: /Ver más/ })).not.toBeInTheDocument();
  });

  it('el segundo renglón muestra la salida más larga del lugar y su fecha, no sólo el ritmo', () => {
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
    const item = screen.getByRole('button', { name: /km acumulados/ });

    // La fila de ritmo sigue ahí...
    expect(item).toHaveTextContent(/\d:\d\d\/km/);
    // ...y abajo, la salida más larga (21.1 km), no la más reciente ni la primera.
    expect(item).toHaveTextContent('21.1 km · 15 jun 2026');
  });

  it('Escape también cierra la ficha', () => {
    const activities = [salidaEn(1, -34.9214, -57.9544), salidaEn(2, -34.9214, -57.9544)];
    render(<LugaresFrecuentados activities={activities} />);

    fireEvent.click(screen.getByRole('button', { name: /km acumulados/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
