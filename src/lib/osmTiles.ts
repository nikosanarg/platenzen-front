/**
 * Utilities for rendering OpenStreetMap raster tiles inside an SVG viewport.
 *
 * Tile coordinate math follows the standard OSM/Slippy Map convention:
 * https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
 */

/** Returns the (fractional) tile x/y for a given lat/lon at a zoom level. */
export function latLonToTileFloat(lat: number, lon: number, zoom: number): [number, number] {
  const n = Math.pow(2, zoom);
  const x = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return [x, y];
}

/** Returns the integer tile indices for a given lat/lon at a zoom level. */
export function latLonToTile(lat: number, lon: number, zoom: number): [number, number] {
  const [x, y] = latLonToTileFloat(lat, lon, zoom);
  return [Math.floor(x), Math.floor(y)];
}

/** Returns the NW corner [lat, lon] of an OSM tile. */
export function tileNWCorner(tx: number, ty: number, zoom: number): [number, number] {
  const n = Math.pow(2, zoom);
  const lon = (tx / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n)));
  const lat = (latRad * 180) / Math.PI;
  return [lat, lon];
}

/**
 * Chooses the largest zoom level where the bounding box fits within
 * at most `maxTiles` tiles in each dimension.
 */
export function chooseBestZoom(
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number,
  maxTilesPerAxis = 4,
): number {
  for (let zoom = 16; zoom >= 1; zoom--) {
    const [x0] = latLonToTile(maxLat, minLon, zoom);
    const [x1] = latLonToTile(minLat, maxLon, zoom);
    const [, y0] = latLonToTile(maxLat, minLon, zoom);
    const [, y1] = latLonToTile(minLat, maxLon, zoom);
    if (x1 - x0 + 1 <= maxTilesPerAxis && y1 - y0 + 1 <= maxTilesPerAxis) {
      return zoom;
    }
  }
  // Zoom 10 provides ~city-scale detail (≈150 km viewable width) and is a
  // reasonable default when the bounding box is too large for finer levels.
  return 10;
}

export interface OsmTile {
  tx: number;
  ty: number;
  zoom: number;
  url: string;
  /** NW corner lat/lon */
  nwLat: number;
  nwLon: number;
  /** SE corner lat/lon */
  seLat: number;
  seLon: number;
}

/**
 * Returns the set of OSM tiles that cover the given bounding box at the
 * chosen zoom level.  Pass a `margin` (in fractional tiles) to include a
 * small buffer beyond the exact bounds.
 */
export function getTilesForBounds(
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number,
  maxTilesPerAxis = 4,
): OsmTile[] {
  const zoom = chooseBestZoom(minLat, maxLat, minLon, maxLon, maxTilesPerAxis);

  const [x0, y0] = latLonToTile(maxLat, minLon, zoom); // NW tile
  const [x1, y1] = latLonToTile(minLat, maxLon, zoom); // SE tile

  const tiles: OsmTile[] = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const [nwLat, nwLon] = tileNWCorner(tx, ty, zoom);
      const [seLat, seLon] = tileNWCorner(tx + 1, ty + 1, zoom);
      tiles.push({
        tx,
        ty,
        zoom,
        url: `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`,
        nwLat,
        nwLon,
        seLat,
        seLon,
      });
    }
  }
  return tiles;
}
