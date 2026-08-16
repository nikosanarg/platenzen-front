'use client';

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Activity } from '@/types/activity';
import { computeWorldMap, clusterZones, ZoneCluster, formatPaceStr } from '@/lib/worldMap';
import {
  TILE_SIZE,
  latLonToWorldPx,
  worldPxToLatLon,
} from '@/lib/osmTiles';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  Root,
  Layout,
  HeatmapContainer,
  HeatmapSvg,
  Tooltip,
  ZoneList,
  ZoneItem,
  ZoneRank,
  ZoneInfo,
  ZoneName,
  ZoneMeta,
  ZoneVisits,
  DetailPanel,
  DetailTitle,
  DetailStats,
  DetailStat,
  DetailStatValue,
  DetailStatLabel,
  RecentActivities,
  ActivityRow,
  EmptyState,
  SubTitle,
  ZoomControls,
  ZoomButton,
  MapHint,
} from './styled';

const SVG_W = 600;
const SVG_H = 360;

/**
 * Zoom de arranque: a esta escala el viewport abarca ~2 km de ancho, que es
 * nivel barrio — la escala a la que "donde corri" se puede leer en el mapa.
 */
const ZOOM_INICIAL = 15;

// Se puede alejar hasta ver la ciudad y sus alrededores, no mas: el mapa
// responde "por donde corro", no "en que pais estuve".
const ZOOM_MIN = 10;
const ZOOM_MAX = 17;

interface TooltipState {
  x: number;
  y: number;
  text: string;
}

interface Vista {
  centerLat: number;
  centerLon: number;
  zoom: number;
}

interface TuMundoProps {
  activities: Activity[];
}

const TuMundo: React.FC<TuMundoProps> = ({ activities }) => {
  const data = useMemo(() => computeWorldMap(activities), [activities]);
  const [vistaUsuario, setVistaUsuario] = useState<Vista | null>(null);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const arrastreRef = useRef<{ x: number; y: number } | null>(null);

  // Encuadre inicial: todo el territorio recorrido. Se **deriva**, no se asigna
  // en un efecto — así la primera pintura ya sale bien encuadrada, sin un
  // fotograma intermedio con el mapa en otro lado.
  const vistaInicial = useMemo<Vista | null>(() => {
    if (!data || data.zones.length === 0) return null;
    // Centrado en el lugar mas frecuentado, no en el centro geometrico de todo
    // lo recorrido: con salidas en dos ciudades, ese centro cae en el medio del
    // campo, donde no se corrio nunca.
    const principal = [...data.zones].sort((a, b) => b.visitCount - a.visitCount)[0];
    return { centerLat: principal.lat, centerLon: principal.lon, zoom: ZOOM_INICIAL };
  }, [data]);

  // Mientras el usuario no toque nada manda el encuadre inicial; apenas mueve o
  // hace zoom, manda el suyo.
  const vista = vistaUsuario ?? vistaInicial;

  const actualizarVista = useCallback(
    (fn: (actual: Vista) => Vista) => {
      setVistaUsuario(prev => {
        const base = prev ?? vistaInicial;
        return base ? fn(base) : prev;
      });
    },
    [vistaInicial]
  );

  /**
   * Píxel de pantalla para un punto del mapa. Mercator, la misma proyección que
   * usan los tiles: con cualquier otra, los puntos se despegan del mapa a medida
   * que uno se aleja.
   */
  const project = useCallback(
    (lat: number, lon: number): [number, number] => {
      if (!vista) return [0, 0];
      const [cx, cy] = latLonToWorldPx(vista.centerLat, vista.centerLon, vista.zoom);
      const [px, py] = latLonToWorldPx(lat, lon, vista.zoom);
      return [px - cx + SVG_W / 2, py - cy + SVG_H / 2];
    },
    [vista]
  );

  // El agrupado NO depende del zoom: ver el comentario de `clusterZones`.
  // Si dependiera, acercarse partiria un lugar en sus celdas de 1 km y la lista
  // volveria a repetir la misma salida en varias filas.
  const clusters = useMemo(() => (data ? clusterZones(data.zones) : []), [data]);

  /** Los tiles que tocan el viewport al zoom actual. */
  const tiles = useMemo(() => {
    if (!vista) return [];
    const [cx, cy] = latLonToWorldPx(vista.centerLat, vista.centerLon, vista.zoom);
    const origenX = cx - SVG_W / 2;
    const origenY = cy - SVG_H / 2;

    const tx0 = Math.floor(origenX / TILE_SIZE);
    const ty0 = Math.floor(origenY / TILE_SIZE);
    const tx1 = Math.floor((origenX + SVG_W) / TILE_SIZE);
    const ty1 = Math.floor((origenY + SVG_H) / TILE_SIZE);

    const maxIndice = Math.pow(2, vista.zoom) - 1;
    const salida: { key: string; url: string; x: number; y: number }[] = [];

    for (let ty = ty0; ty <= ty1; ty++) {
      // Fuera de rango vertical no hay mundo que mostrar (el horizontal envuelve).
      if (ty < 0 || ty > maxIndice) continue;
      for (let tx = tx0; tx <= tx1; tx++) {
        const txEnvuelto = ((tx % (maxIndice + 1)) + maxIndice + 1) % (maxIndice + 1);
        salida.push({
          key: `${tx}-${ty}`,
          url: `https://tile.openstreetmap.org/${vista.zoom}/${txEnvuelto}/${ty}.png`,
          x: tx * TILE_SIZE - origenX,
          y: ty * TILE_SIZE - origenY,
        });
      }
    }
    return salida;
  }, [vista]);

  const cambiarZoom = useCallback(
    (delta: number, anclaX?: number, anclaY?: number) => {
      actualizarVista(prev => {
        const nuevoZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev.zoom + delta));
        if (nuevoZoom === prev.zoom) return prev;

        // Sin ancla, se acerca al centro. Con ancla (la rueda del mouse), el
        // punto bajo el cursor se queda quieto: es lo que hace que acercarse a
        // una zona concreta no la corra de la pantalla.
        if (anclaX === undefined || anclaY === undefined) {
          return { ...prev, zoom: nuevoZoom };
        }

        const [cx, cy] = latLonToWorldPx(prev.centerLat, prev.centerLon, prev.zoom);
        const [latAncla, lonAncla] = worldPxToLatLon(
          cx - SVG_W / 2 + anclaX,
          cy - SVG_H / 2 + anclaY,
          prev.zoom
        );

        const [ax, ay] = latLonToWorldPx(latAncla, lonAncla, nuevoZoom);
        const [nuevoCentroLat, nuevoCentroLon] = worldPxToLatLon(
          ax - anclaX + SVG_W / 2,
          ay - anclaY + SVG_H / 2,
          nuevoZoom
        );

        return { centerLat: nuevoCentroLat, centerLon: nuevoCentroLon, zoom: nuevoZoom };
      });
    },
    [actualizarVista]
  );

  /** Pasa de coordenadas del navegador a coordenadas del viewBox del SVG. */
  const aCoordsSvg = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return [
      ((clientX - rect.left) / rect.width) * SVG_W,
      ((clientY - rect.top) / rect.height) * SVG_H,
    ];
  }, []);

  // La rueda se escucha con un listener propio y no con `onWheel` de React:
  // React lo registra como pasivo y `preventDefault()` no tendría efecto, así
  // que acercarse al mapa scrollearía la página entera.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const alRodar = (e: WheelEvent) => {
      e.preventDefault();
      const coords = aCoordsSvg(e.clientX, e.clientY);
      if (!coords) return;
      cambiarZoom(e.deltaY < 0 ? 1 : -1, coords[0], coords[1]);
    };

    svg.addEventListener('wheel', alRodar, { passive: false });
    return () => svg.removeEventListener('wheel', alRodar);
  }, [aCoordsSvg, cambiarZoom]);

  const alPresionar = (e: React.MouseEvent) => {
    arrastreRef.current = { x: e.clientX, y: e.clientY };
    setArrastrando(true);
  };

  const alMover = (e: React.MouseEvent) => {
    const arrastre = arrastreRef.current;
    if (!arrastre) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dx = ((e.clientX - arrastre.x) / rect.width) * SVG_W;
    const dy = ((e.clientY - arrastre.y) / rect.height) * SVG_H;
    if (dx === 0 && dy === 0) return;

    arrastreRef.current = { x: e.clientX, y: e.clientY };

    actualizarVista(prev => {
      const [cx, cy] = latLonToWorldPx(prev.centerLat, prev.centerLon, prev.zoom);
      const [lat, lon] = worldPxToLatLon(cx - dx, cy - dy, prev.zoom);
      return { ...prev, centerLat: lat, centerLon: lon };
    });
  };

  const soltarArrastre = () => {
    arrastreRef.current = null;
    setArrastrando(false);
  };

  /** Centra el mapa en un grupo y se acerca, para poder abrirlo. */
  const enfocar = (cluster: ZoneCluster) => {
    setSeleccionado(prev => (prev === cluster.id ? null : cluster.id));
    actualizarVista(prev => ({
      centerLat: cluster.lat,
      centerLon: cluster.lon,
      // Se acerca a nivel barrio si estaba mas lejos; si ya estaba cerca, respeta
      // el zoom que el usuario eligio.
      zoom: Math.max(prev.zoom, ZOOM_INICIAL),
    }));
  };

  if (!data || data.zones.length === 0) {
    return (
      <Root>
        <SectionTitle>Tu Mundo</SectionTitle>
        <EmptyState>Necesitás actividades con recorrido registrado para ver tu mundo.</EmptyState>
      </Root>
    );
  }

  const maxVisitas = clusters[0]?.visitCount ?? 1;
  const detalle = clusters.find(c => c.id === seleccionado) ?? null;

  return (
    <Root>
      <SectionTitle>Tu Mundo</SectionTitle>

      <Layout>
        <HeatmapContainer>
          <HeatmapSvg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            aria-label="Mapa de zonas recorridas"
            onMouseDown={alPresionar}
            onMouseMove={alMover}
            onMouseUp={soltarArrastre}
            onMouseLeave={() => {
              soltarArrastre();
              setTooltip(null);
            }}
            style={{ cursor: arrastrando ? 'grabbing' : 'grab' }}
          >
            <rect width={SVG_W} height={SVG_H} fill="var(--bg-primary)" rx="8" />

            {tiles.map(tile => (
              <image
                key={tile.key}
                href={tile.url}
                x={tile.x}
                y={tile.y}
                width={TILE_SIZE}
                height={TILE_SIZE}
                preserveAspectRatio="none"
                style={{ filter: 'brightness(0.35) saturate(0.5)', opacity: 0.85 }}
              />
            ))}

            {clusters.map(cluster => {
              const [cx, cy] = project(cluster.lat, cluster.lon);
              // Fuera del viewport no se dibuja: con zoom alto son la mayoría.
              if (cx < -60 || cx > SVG_W + 60 || cy < -60 || cy > SVG_H + 60) return null;

              const intensidad = cluster.visitCount / maxVisitas;
              const r = 6 + intensidad * 14;
              const activo = seleccionado === cluster.id;

              return (
                <g key={cluster.id}>
                  <circle cx={cx} cy={cy} r={r + 6} fill={`rgba(252, 76, 2, ${intensidad * 0.15})`} />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={`rgba(252, 76, 2, ${0.3 + intensidad * 0.5})`}
                    stroke={activo ? '#fc4c02' : 'transparent'}
                    strokeWidth={activo ? 2 : 0}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSeleccionado(prev => (prev === cluster.id ? null : cluster.id))}
                    onMouseEnter={e => {
                      const coords = aCoordsSvg(e.clientX, e.clientY);
                      if (!coords) return;
                      setTooltip({
                        x: ((coords[0] + 12) / SVG_W) * 100,
                        y: ((coords[1] - 36) / SVG_H) * 100,
                        text: `${cluster.visitCount} salida${cluster.visitCount !== 1 ? 's' : ''} · ${cluster.distanceKm} km`,
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                </g>
              );
            })}
          </HeatmapSvg>

          <ZoomControls>
            <ZoomButton
              type="button"
              onClick={() => cambiarZoom(1)}
              aria-label="Acercar"
              disabled={(vista?.zoom ?? 0) >= ZOOM_MAX}
            >
              +
            </ZoomButton>
            <ZoomButton
              type="button"
              onClick={() => cambiarZoom(-1)}
              aria-label="Alejar"
              disabled={(vista?.zoom ?? 0) <= ZOOM_MIN}
            >
              −
            </ZoomButton>
          </ZoomControls>

          {tooltip && (
            <Tooltip $visible style={{ left: `${tooltip.x}%`, top: `${tooltip.y}%` }}>
              {tooltip.text}
            </Tooltip>
          )}
        </HeatmapContainer>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <SubTitle>Zonas más frecuentadas</SubTitle>
          <MapHint>Tocá una zona para verla en el mapa. Arrastrá para moverte y usá la rueda para acercarte.</MapHint>
          <ZoneList>
            {clusters.slice(0, 15).map((cluster, idx) => (
              <ZoneItem
                key={cluster.id}
                $active={seleccionado === cluster.id}
                onClick={() => enfocar(cluster)}
              >
                <ZoneRank>#{idx + 1}</ZoneRank>
                <ZoneInfo>
                  <ZoneName>{cluster.distanceKm} km acumulados</ZoneName>
                  <ZoneMeta>Última visita: {cluster.lastVisit}</ZoneMeta>
                </ZoneInfo>
                <ZoneVisits>{cluster.visitCount}×</ZoneVisits>
              </ZoneItem>
            ))}
          </ZoneList>
        </div>
      </Layout>

      {detalle && (
        <DetailPanel>
          <DetailTitle>Detalle de zona</DetailTitle>
          <DetailStats>
            <DetailStat>
              <DetailStatValue>{detalle.visitCount}</DetailStatValue>
              <DetailStatLabel>Entrenamientos</DetailStatLabel>
            </DetailStat>
            <DetailStat>
              <DetailStatValue>{detalle.distanceKm} km</DetailStatValue>
              <DetailStatLabel>Distancia acumulada</DetailStatLabel>
            </DetailStat>
            <DetailStat>
              <DetailStatValue>{formatPaceStr(detalle.bestPaceSecPerKm)}</DetailStatValue>
              <DetailStatLabel>Mejor marca</DetailStatLabel>
            </DetailStat>
            <DetailStat>
              <DetailStatValue>{detalle.lastVisit}</DetailStatValue>
              <DetailStatLabel>Última visita</DetailStatLabel>
            </DetailStat>
          </DetailStats>
          <RecentActivities>
            {detalle.activities.slice(0, 5).map(act => (
              <ActivityRow key={act.activityId}>
                {act.name} — {act.distanceKm.toFixed(1)} km
              </ActivityRow>
            ))}
          </RecentActivities>
        </DetailPanel>
      )}
    </Root>
  );
};

export default TuMundo;
