/**
 * Matemática de tiles de OpenStreetMap (convención Slippy Map). Es geometría
 * pura y verificable contra valores conocidos: en zoom 0 hay un solo tile que
 * cubre el mundo, y el meridiano de Greenwich con el ecuador caen en la esquina
 * donde se juntan los cuatro tiles centrales.
 */
import {
  chooseBestZoom,
  getTilesForBounds,
  latLonToTile,
  latLonToTileFloat,
  tileNWCorner,
} from '@/lib/osmTiles';

describe('latLonToTileFloat', () => {
  it('en zoom 0 el mundo entero es un tile', () => {
    const [x, y] = latLonToTileFloat(0, 0, 0);

    expect(x).toBeCloseTo(0.5, 6);
    expect(y).toBeCloseTo(0.5, 6);
  });

  it('el antimeridiano oeste es x = 0', () => {
    expect(latLonToTileFloat(0, -180, 0)[0]).toBeCloseTo(0, 6);
  });

  it('en zoom 1 el mundo se divide en 2×2', () => {
    const [x, y] = latLonToTileFloat(0, 0, 1);

    expect(x).toBeCloseTo(1, 6);
    expect(y).toBeCloseTo(1, 6);
  });

  it('la longitud crece con x y la latitud decrece con y', () => {
    const [xOeste] = latLonToTileFloat(0, -60, 5);
    const [xEste] = latLonToTileFloat(0, 60, 5);
    expect(xEste).toBeGreaterThan(xOeste);

    const [, yNorte] = latLonToTileFloat(50, 0, 5);
    const [, ySur] = latLonToTileFloat(-50, 0, 5);
    expect(ySur).toBeGreaterThan(yNorte);
  });
});

describe('latLonToTile', () => {
  it('trunca la parte fraccionaria', () => {
    expect(latLonToTile(0, 0, 1)).toEqual([1, 1]);
  });

  it('ubica La Plata en el tile esperado en zoom 10', () => {
    const [x, y] = latLonToTile(-34.9214, -57.9544, 10);
    const [fx, fy] = latLonToTileFloat(-34.9214, -57.9544, 10);

    expect(x).toBe(Math.floor(fx));
    expect(y).toBe(Math.floor(fy));
  });
});

describe('tileNWCorner', () => {
  it('el tile 0,0 arranca en el extremo noroeste del mundo', () => {
    const [lat, lon] = tileNWCorner(0, 0, 0);

    expect(lon).toBe(-180);
    expect(lat).toBeCloseTo(85.0511, 3);
  });

  it('es la inversa de latLonToTile: ida y vuelta cae en el mismo tile', () => {
    const zoom = 12;
    const [tx, ty] = latLonToTile(-34.9214, -57.9544, zoom);
    const [lat, lon] = tileNWCorner(tx, ty, zoom);

    expect(latLonToTile(lat - 0.0001, lon + 0.0001, zoom)).toEqual([tx, ty]);
  });

  it('en zoom 1 el tile 1,1 arranca en el ecuador y Greenwich', () => {
    const [lat, lon] = tileNWCorner(1, 1, 1);

    expect(lon).toBe(0);
    expect(lat).toBeCloseTo(0, 6);
  });
});

describe('chooseBestZoom', () => {
  it('elige un zoom alto para un área chica', () => {
    const zoom = chooseBestZoom(-34.93, -34.91, -57.96, -57.94);
    expect(zoom).toBeGreaterThan(10);
  });

  it('elige un zoom bajo para un área grande', () => {
    const chico = chooseBestZoom(-34.93, -34.91, -57.96, -57.94);
    const grande = chooseBestZoom(-55, -22, -73, -53);

    expect(grande).toBeLessThan(chico);
  });

  it('no pasa de 16', () => {
    expect(chooseBestZoom(-34.9214, -34.9213, -57.9544, -57.9543)).toBeLessThanOrEqual(16);
  });

  it('cae en 10 cuando ni el zoom 1 alcanza', () => {
    // Mundo entero: en zoom 1 ya son 2 tiles por eje, así que con 1 permitido falla.
    expect(chooseBestZoom(-85, 85, -180, 180, 1)).toBe(10);
  });

  it('respeta el máximo de tiles por eje', () => {
    const zoom = chooseBestZoom(-35, -34, -58, -57, 2);
    const tiles = getTilesForBounds(-35, -34, -58, -57, 2);
    const columnas = new Set(tiles.map((t) => t.tx)).size;

    expect(columnas).toBeLessThanOrEqual(2);
    expect(zoom).toBeGreaterThan(0);
  });
});

describe('getTilesForBounds', () => {
  it('devuelve al menos un tile', () => {
    expect(getTilesForBounds(-34.93, -34.91, -57.96, -57.94).length).toBeGreaterThan(0);
  });

  it('todos los tiles comparten el mismo zoom', () => {
    const tiles = getTilesForBounds(-35, -34, -58, -57);
    expect(new Set(tiles.map((t) => t.zoom)).size).toBe(1);
  });

  it('apunta a la CDN de OpenStreetMap con el patrón zoom/x/y', () => {
    const [tile] = getTilesForBounds(-34.93, -34.91, -57.96, -57.94);
    expect(tile.url).toBe(`https://tile.openstreetmap.org/${tile.zoom}/${tile.tx}/${tile.ty}.png`);
  });

  it('cada tile trae sus esquinas NO y SE coherentes', () => {
    for (const tile of getTilesForBounds(-35, -34, -58, -57)) {
      // Al sur la latitud baja; al este la longitud sube.
      expect(tile.seLat).toBeLessThan(tile.nwLat);
      expect(tile.seLon).toBeGreaterThan(tile.nwLon);
    }
  });

  it('la grilla cubre el bounding box pedido', () => {
    const minLat = -35, maxLat = -34, minLon = -58, maxLon = -57;
    const tiles = getTilesForBounds(minLat, maxLat, minLon, maxLon);

    expect(Math.max(...tiles.map((t) => t.nwLat))).toBeGreaterThanOrEqual(maxLat);
    expect(Math.min(...tiles.map((t) => t.seLat))).toBeLessThanOrEqual(minLat);
    expect(Math.min(...tiles.map((t) => t.nwLon))).toBeLessThanOrEqual(minLon);
    expect(Math.max(...tiles.map((t) => t.seLon))).toBeGreaterThanOrEqual(maxLon);
  });

  it('no repite coordenadas de tile', () => {
    const tiles = getTilesForBounds(-35, -34, -58, -57);
    const claves = tiles.map((t) => `${t.tx}/${t.ty}`);

    expect(new Set(claves).size).toBe(claves.length);
  });
});
