'use client';

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Activity } from '@/types/activity';
import { useLugares, Lugar } from '@/hooks/useLugares';
import { computeRouteLayer, summarizeCluster, formatPaceStr, RouteLine } from '@/lib/worldMap';
import {
  TILE_SIZE,
  latLonToWorldPx,
  worldPxToLatLon,
} from '@/lib/osmTiles';
import { SectionTitle } from '@/components/Dashboard/styled';
import { IconChevronUp, IconTrendUp, IconTrendDown, IconTrendFlat } from '@/components/Icon';
import StatCard from '@/components/StatCard';
import {
  Root,
  MapHint,
  Layout,
  HeatmapContainer,
  HeatmapSvg,
  MarkerGroup,
  Tooltip,
  EmptyState,
  ZoomControls,
  ZoomButton,
  Sidebar,
  SidebarHeader,
  SidebarTitle,
  SortSwitch,
  SortButton,
  PlaceScroll,
  PlaceRank,
  BackButton,
  DetailScroll,
  DetailTitle,
  DetailStats,
  DetailStat,
  DetailStatValue,
  DetailStatLabel,
  TrendRow,
  TrendPace,
  ActivitiesLabel,
  ActivityList,
  ActivityRow,
  ActivityRowName,
  ActivityRowStats,
  ShowAllButton,
} from './styled';

const SVG_W = 600;
const SVG_H = 360;

/**
 * Zoom de arranque: a esta escala el viewport abarca ~2 km de ancho, que es
 * nivel barrio — la escala a la que "donde corri" se puede leer en el mapa.
 * Es también el zoom al que se encuadra un lugar elegido desde la lista: el
 * radio de un lugar (`RADIO_ZONA_KM` en worldMap.ts) es del mismo orden.
 */
const ZOOM_INICIAL = 15;

// Se puede alejar hasta ver la ciudad y sus alrededores, no mas: el mapa
// responde "por donde corro", no "en que pais estuve".
const ZOOM_MIN = 10;
const ZOOM_MAX = 17;

/** Cuántas salidas de un lugar entran en el detalle antes de pedir "ver todas". */
const ACTIVIDADES_VISIBLES = 10;

/** Cuántos lugares llevan su nombre siempre visible en el mapa: el resto sólo en el tooltip. */
const ETIQUETAS_VISIBLES = 5;

const OPACIDAD_BASE = 0.22;
const OPACIDAD_LUGAR = 0.6;
const OPACIDAD_APAGADA = 0.05;

type OrdenLista = 'visitas' | 'km';

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
  /** El lugar a mostrar de entrada, cuando se llega desde un link con `?lugar=`. */
  initialClusterId?: string;
}

function pathD(points: [number, number][], project: (wx: number, wy: number) => [number, number]): string {
  let d = '';
  for (let i = 0; i < points.length; i++) {
    const [px, py] = project(points[i][0], points[i][1]);
    d += `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`;
  }
  return d;
}

const TuMundo: React.FC<TuMundoProps> = ({ activities, initialClusterId }) => {
  const lugares = useLugares(activities);
  const rutas = useMemo(() => computeRouteLayer(activities), [activities]);

  const [vistaUsuario, setVistaUsuario] = useState<Vista | null>(null);
  const [seleccionado, setSeleccionado] = useState<string | null>(initialClusterId ?? null);
  const [actividadResaltada, setActividadResaltada] = useState<number | null>(null);
  const [ordenPor, setOrdenPor] = useState<OrdenLista>('visitas');
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const arrastreRef = useRef<{ x: number; y: number } | null>(null);

  // Encuadre inicial: el lugar pedido (si se llega con `?lugar=`) o el
  // territorio mas frecuentado. Se **deriva**, no se asigna en un efecto —
  // así la primera pintura ya sale bien encuadrada, sin un fotograma
  // intermedio con el mapa en otro lado.
  const vistaInicial = useMemo<Vista | null>(() => {
    if (lugares.length === 0) return null;
    const pedido = initialClusterId ? lugares.find(l => l.id === initialClusterId) : undefined;
    // Sin pedido explicito, centrado en el lugar mas frecuentado, no en el
    // centro geometrico de todo lo recorrido: con salidas en dos ciudades, ese
    // centro cae en el medio del campo, donde no se corrio nunca.
    const principal = pedido ?? lugares[0];
    return { centerLat: principal.lat, centerLon: principal.lon, zoom: ZOOM_INICIAL };
  }, [lugares, initialClusterId]);

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
   * Píxel de pantalla para un punto lat/lon del mapa. Mercator, la misma
   * proyección que usan los tiles: con cualquier otra, los puntos se
   * despegan del mapa a medida que uno se aleja.
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

  /**
   * Igual que `project`, pero para puntos ya proyectados a píxeles de mundo a
   * zoom 0 (`RouteLine.points`): multiplicar por 2^zoom y restar el origen es
   * aritmética simple, sin trigonometría — es lo que hace que dibujar cientos
   * de recorridos en cada frame de un arrastre no cueste caro.
   */
  const projectZoom0 = useCallback(
    (wx0: number, wy0: number): [number, number] => {
      if (!vista) return [0, 0];
      const escala = Math.pow(2, vista.zoom);
      const [cx, cy] = latLonToWorldPx(vista.centerLat, vista.centerLon, vista.zoom);
      return [wx0 * escala - cx + SVG_W / 2, wy0 * escala - cy + SVG_H / 2];
    },
    [vista]
  );

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

  /**
   * Arrastre con Pointer Events (no Mouse Events): un solo camino para mouse
   * y para dedo, y `setPointerCapture` sostiene el arrastre aunque el dedo o
   * el cursor salgan del SVG — sin eso, el mapa no se movía al arrastrar en
   * pantallas táctiles.
   */
  const alPresionar = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastreRef.current = { x: e.clientX, y: e.clientY };
    setArrastrando(true);
  };

  const alMover = (e: React.PointerEvent<SVGSVGElement>) => {
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

  const seleccionarLugar = useCallback((lugar: Lugar) => {
    setSeleccionado(lugar.id);
    setActividadResaltada(null);
    setMostrarTodas(false);
    setVistaUsuario({ centerLat: lugar.lat, centerLon: lugar.lon, zoom: ZOOM_INICIAL });
  }, []);

  const volverALista = useCallback(() => {
    setSeleccionado(null);
    setActividadResaltada(null);
    setMostrarTodas(false);
  }, []);

  const alClickMarcador = (lugar: Lugar) => {
    if (seleccionado === lugar.id) volverALista();
    else seleccionarLugar(lugar);
  };

  if (lugares.length === 0) {
    return (
      <Root>
        <SectionTitle>Tu Mundo</SectionTitle>
        <EmptyState>Necesitás actividades con recorrido registrado para ver tu mundo.</EmptyState>
      </Root>
    );
  }

  const maxVisitas = lugares[0]?.visitCount ?? 1;
  const detalle = lugares.find(l => l.id === seleccionado) ?? null;
  const resumen = detalle ? summarizeCluster(detalle) : null;
  const etiquetados = new Set(lugares.slice(0, ETIQUETAS_VISIBLES).map(l => l.id));
  if (seleccionado) etiquetados.add(seleccionado);

  // Reparto de recorridos en tres capas de dibujo (atrás → adelante): el
  // resto apagado, los del lugar elegido, y encima la salida puntual que se
  // haya tocado en la lista — así lo que importa siempre queda arriba.
  const idsDelLugar = detalle ? new Set(detalle.activities.map(a => a.activityId)) : null;
  const rutasFondo: RouteLine[] = [];
  const rutasLugar: RouteLine[] = [];
  let rutaResaltada: RouteLine | null = null;
  for (const r of rutas) {
    if (actividadResaltada !== null && r.activityId === actividadResaltada) {
      rutaResaltada = r;
    } else if (idsDelLugar?.has(r.activityId)) {
      rutasLugar.push(r);
    } else {
      rutasFondo.push(r);
    }
  }

  const listaOrdenada = [...lugares].sort((a, b) =>
    ordenPor === 'km' ? b.distanceKm - a.distanceKm : b.visitCount - a.visitCount
  );

  const actividadesDetalle = detalle
    ? mostrarTodas
      ? detalle.activities
      : detalle.activities.slice(0, ACTIVIDADES_VISIBLES)
    : [];

  return (
    <Root>
      <SectionTitle>Tu Mundo</SectionTitle>
      <MapHint>Arrastrá para moverte · rueda o +/− para acercarte.</MapHint>

      <Layout>
        <HeatmapContainer>
          <HeatmapSvg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            aria-label="Mapa de zonas recorridas"
            onPointerDown={alPresionar}
            onPointerMove={alMover}
            onPointerUp={soltarArrastre}
            onPointerCancel={soltarArrastre}
            onPointerLeave={() => setTooltip(null)}
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

            {/* Recorridos: la calle que se corre más veces suma opacidad y se ve más clara. */}
            <g style={{ mixBlendMode: 'screen' }}>
              {rutasFondo.map(r => (
                <path
                  key={r.activityId}
                  d={pathD(r.points, projectZoom0)}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={detalle ? OPACIDAD_APAGADA : OPACIDAD_BASE}
                />
              ))}
              {rutasLugar.map(r => (
                <path
                  key={r.activityId}
                  d={pathD(r.points, projectZoom0)}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={2.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={OPACIDAD_LUGAR}
                />
              ))}
              {rutaResaltada && (
                <path
                  d={pathD(rutaResaltada.points, projectZoom0)}
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={1}
                />
              )}
            </g>

            {listaOrdenada.map(lugar => {
              const [cx, cy] = project(lugar.lat, lugar.lon);
              // Fuera del viewport no se dibuja: con zoom alto son la mayoría.
              if (cx < -60 || cx > SVG_W + 60 || cy < -60 || cy > SVG_H + 60) return null;

              const intensidad = lugar.visitCount / maxVisitas;
              const r = 6 + intensidad * 14;
              const activo = seleccionado === lugar.id;
              const apagado = detalle !== null && !activo;

              return (
                <MarkerGroup
                  key={lugar.id}
                  tabIndex={0}
                  role="button"
                  aria-pressed={activo}
                  aria-label={`${lugar.nombre}: ${lugar.visitCount} salida${lugar.visitCount !== 1 ? 's' : ''}, ${lugar.distanceKm} km`}
                  style={{ cursor: 'pointer', opacity: apagado ? 0.35 : 1 }}
                  onClick={() => alClickMarcador(lugar)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      alClickMarcador(lugar);
                    }
                  }}
                  onMouseEnter={e => {
                    const coords = aCoordsSvg(e.clientX, e.clientY);
                    if (!coords) return;
                    setTooltip({
                      x: ((coords[0] + 12) / SVG_W) * 100,
                      y: ((coords[1] - 36) / SVG_H) * 100,
                      text: `${lugar.nombre} · ${lugar.visitCount} salida${lugar.visitCount !== 1 ? 's' : ''} · ${lugar.distanceKm} km`,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <circle cx={cx} cy={cy} r={r + 6} fill={`rgba(252, 76, 2, ${intensidad * 0.15})`} />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={`rgba(252, 76, 2, ${0.3 + intensidad * 0.5})`}
                    stroke={activo ? '#fc4c02' : 'transparent'}
                    strokeWidth={activo ? 2 : 0}
                  />
                  {etiquetados.has(lugar.id) && (
                    <text
                      x={cx}
                      y={cy - r - 6}
                      textAnchor="middle"
                      fill="var(--text-primary)"
                      fontFamily="var(--font)"
                      fontSize={10}
                      fontWeight={activo ? 700 : 500}
                      style={{ paintOrder: 'stroke', stroke: 'var(--bg-primary)', strokeWidth: 3 }}
                    >
                      {lugar.nombre}
                    </text>
                  )}
                </MarkerGroup>
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

        <Sidebar role="region" aria-label="Lugares del mapa">
          {detalle ? (
            <>
              <BackButton type="button" onClick={volverALista}>
                <IconChevronUp size={13} />
                Lugares
              </BackButton>

              <DetailScroll>
                <DetailTitle>{detalle.nombre}</DetailTitle>

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
                    <DetailStatLabel>Mejor ritmo</DetailStatLabel>
                  </DetailStat>
                  <DetailStat>
                    <DetailStatValue>{detalle.lastVisit}</DetailStatValue>
                    <DetailStatLabel>Última visita</DetailStatLabel>
                  </DetailStat>
                  <DetailStat>
                    <DetailStatValue>{resumen!.firstVisit}</DetailStatValue>
                    <DetailStatLabel>Primera visita</DetailStatLabel>
                  </DetailStat>
                  <DetailStat>
                    <DetailStatValue>{resumen!.longestRun.distanceKm.toFixed(1)} km</DetailStatValue>
                    <DetailStatLabel>Salida más larga</DetailStatLabel>
                  </DetailStat>
                </DetailStats>

                {resumen!.paceTrend && (() => {
                  const { early, late } = resumen!.paceTrend!;
                  const mejora = late < early;
                  const empeora = late > early;
                  const tono = mejora ? 'positive' : empeora ? 'warning' : 'neutral';
                  const Icono = mejora ? IconTrendUp : empeora ? IconTrendDown : IconTrendFlat;
                  return (
                    <TrendRow $tone={tono}>
                      <Icono size={14} color="currentColor" />
                      Ritmo acá: <TrendPace>{formatPaceStr(early)}</TrendPace> →{' '}
                      <TrendPace>{formatPaceStr(late)}</TrendPace> (primeras 5 vs. últimas 5)
                    </TrendRow>
                  );
                })()}

                <div>
                  <ActivitiesLabel>Salidas</ActivitiesLabel>
                  <ActivityList>
                    {actividadesDetalle.map(act => (
                      <ActivityRow
                        key={act.activityId}
                        type="button"
                        $active={actividadResaltada === act.activityId}
                        aria-pressed={actividadResaltada === act.activityId}
                        onClick={() =>
                          setActividadResaltada(prev => (prev === act.activityId ? null : act.activityId))
                        }
                      >
                        <ActivityRowName title={act.name}>{act.name}</ActivityRowName>
                        <ActivityRowStats>
                          {act.distanceKm.toFixed(1)} km · {formatPaceStr(act.paceSecPerKm)}
                        </ActivityRowStats>
                      </ActivityRow>
                    ))}
                  </ActivityList>
                  {!mostrarTodas && detalle.activities.length > ACTIVIDADES_VISIBLES && (
                    <ShowAllButton type="button" onClick={() => setMostrarTodas(true)}>
                      Ver las {detalle.activities.length} salidas
                    </ShowAllButton>
                  )}
                </div>
              </DetailScroll>
            </>
          ) : (
            <>
              <SidebarHeader>
                <SidebarTitle>Lugares</SidebarTitle>
                <SortSwitch role="group" aria-label="Ordenar lugares">
                  <SortButton
                    type="button"
                    $active={ordenPor === 'visitas'}
                    aria-pressed={ordenPor === 'visitas'}
                    onClick={() => setOrdenPor('visitas')}
                  >
                    Salidas
                  </SortButton>
                  <SortButton
                    type="button"
                    $active={ordenPor === 'km'}
                    aria-pressed={ordenPor === 'km'}
                    onClick={() => setOrdenPor('km')}
                  >
                    Km
                  </SortButton>
                </SortSwitch>
              </SidebarHeader>

              <PlaceScroll>
                {listaOrdenada.map((lugar, idx) => (
                  <StatCard
                    key={lugar.id}
                    onClick={() => seleccionarLugar(lugar)}
                    leftVisual={<PlaceRank>#{idx + 1}</PlaceRank>}
                    title={lugar.nombre}
                    subtitles={[`${formatPaceStr(lugar.bestPaceSecPerKm)} · ${lugar.lastVisit}`]}
                    primaryValue={`${lugar.visitCount}×`}
                    secondaryValue={`${lugar.distanceKm} km`}
                  />
                ))}
              </PlaceScroll>
            </>
          )}
        </Sidebar>
      </Layout>
    </Root>
  );
};

export default TuMundo;
