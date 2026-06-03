'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { StravaActivity } from '@/types/strava';
import { computeWorldMap, MapZone, formatPaceStr } from '@/lib/worldMap';
import { getTilesForBounds } from '@/lib/osmTiles';
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
} from './styled';

const SVG_W = 600;
const SVG_H = 360;
const PADDING = 24;

interface TooltipState {
  x: number;
  y: number;
  text: string;
}

interface TuMundoProps {
  activities: StravaActivity[];
}

const TuMundo: React.FC<TuMundoProps> = ({ activities }) => {
  const data = useMemo(() => computeWorldMap(activities), [activities]);
  const [selectedZone, setSelectedZone] = useState<MapZone | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const project = useCallback(
    (lat: number, lon: number): [number, number] => {
      if (!data) return [0, 0];
      const { minLat, maxLat, minLon, maxLon } = data;
      const rangeLat = maxLat - minLat || 0.01;
      const rangeLon = maxLon - minLon || 0.01;

      const x = PADDING + ((lon - minLon) / rangeLon) * (SVG_W - PADDING * 2);
      // Invert lat so north is up
      const y = PADDING + ((maxLat - lat) / rangeLat) * (SVG_H - PADDING * 2);
      return [x, y];
    },
    [data]
  );

  const tiles = useMemo(() => {
    if (!data) return [];
    const { minLat, maxLat, minLon, maxLon } = data;
    // Add a small padding to the bounding box so tiles extend to the SVG edges
    const padLat = (maxLat - minLat) * 0.1 || 0.005;
    const padLon = (maxLon - minLon) * 0.1 || 0.005;
    return getTilesForBounds(
      minLat - padLat,
      maxLat + padLat,
      minLon - padLon,
      maxLon + padLon,
      4,
    );
  }, [data]);

  if (!data || data.zones.length === 0) {
    return (
      <Root>
        <SectionTitle>Tu Mundo</SectionTitle>
        <EmptyState>Necesitás actividades con recorrido registrado para ver tu mundo.</EmptyState>
      </Root>
    );
  }

  const maxVisits = data.zones[0]?.visitCount ?? 1;

  const handleZoneClick = (zone: MapZone) => {
    setSelectedZone(prev => (prev?.id === zone.id ? null : zone));
  };

  const handleZoneHover = (
    e: React.MouseEvent<SVGCircleElement>,
    zone: MapZone
  ) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * SVG_W;
    const svgY = ((e.clientY - rect.top) / rect.height) * SVG_H;
    setTooltip({
      x: ((svgX + 12) / SVG_W) * 100,
      y: ((svgY - 36) / SVG_H) * 100,
      text: `${zone.visitCount} visita${zone.visitCount !== 1 ? 's' : ''} · ${zone.distanceKm} km`,
    });
  };

  return (
    <Root>
      <SectionTitle>Tu Mundo</SectionTitle>

      <Layout>
        {/* Heatmap */}
        <HeatmapContainer>
          <HeatmapSvg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            aria-label="Mapa de zonas recorridas"
          >
            {/* Background */}
            <rect width={SVG_W} height={SVG_H} fill="var(--bg-primary)" rx="8" />

            {/* OSM tile map */}
            {tiles.map(tile => {
              const [x1, y1] = project(tile.nwLat, tile.nwLon);
              const [x2, y2] = project(tile.seLat, tile.seLon);
              return (
                <image
                  key={`${tile.tx}-${tile.ty}`}
                  href={tile.url}
                  x={x1}
                  y={y1}
                  width={x2 - x1}
                  height={y2 - y1}
                  preserveAspectRatio="none"
                  style={{ filter: 'brightness(0.35) saturate(0.5)', opacity: 0.85 }}
                />
              );
            })}

            {/* Heatmap points */}
            {data.zones.map(zone => {
              const [cx, cy] = project(zone.lat, zone.lon);
              const intensity = zone.visitCount / maxVisits;
              const r = 6 + intensity * 18;
              const isSelected = selectedZone?.id === zone.id;
              return (
                <g key={zone.id}>
                  {/* Glow */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r + 6}
                    fill={`rgba(252, 76, 2, ${intensity * 0.15})`}
                  />
                  {/* Main dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={`rgba(252, 76, 2, ${0.3 + intensity * 0.5})`}
                    stroke={isSelected ? '#fc4c02' : 'transparent'}
                    strokeWidth={isSelected ? 2 : 0}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleZoneClick(zone)}
                    onMouseEnter={e => handleZoneHover(e, zone)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                </g>
              );
            })}
          </HeatmapSvg>

          {tooltip && (
            <Tooltip
              $visible
              style={{
                left: `${tooltip.x}%`,
                top: `${tooltip.y}%`,
              }}
            >
              {tooltip.text}
            </Tooltip>
          )}
        </HeatmapContainer>

        {/* Sidebar: zone list + detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <SubTitle>Zonas más frecuentadas</SubTitle>
          <ZoneList>
            {data.zones.slice(0, 15).map((zone, idx) => (
              <ZoneItem
                key={zone.id}
                $active={selectedZone?.id === zone.id}
                onClick={() => handleZoneClick(zone)}
              >
                <ZoneRank>#{idx + 1}</ZoneRank>
                <ZoneInfo>
                  <ZoneName>{zone.distanceKm} km acumulados</ZoneName>
                  <ZoneMeta>Última visita: {zone.lastVisit}</ZoneMeta>
                </ZoneInfo>
                <ZoneVisits>{zone.visitCount}×</ZoneVisits>
              </ZoneItem>
            ))}
          </ZoneList>
        </div>
      </Layout>

      {/* Detail panel */}
      {selectedZone && (
        <DetailPanel>
          <DetailTitle>Detalle de zona</DetailTitle>
          <DetailStats>
            <DetailStat>
              <DetailStatValue>{selectedZone.visitCount}</DetailStatValue>
              <DetailStatLabel>Entrenamientos</DetailStatLabel>
            </DetailStat>
            <DetailStat>
              <DetailStatValue>{selectedZone.distanceKm} km</DetailStatValue>
              <DetailStatLabel>Distancia acumulada</DetailStatLabel>
            </DetailStat>
            <DetailStat>
              <DetailStatValue>
                {formatPaceStr(selectedZone.bestPaceSecPerKm)}
              </DetailStatValue>
              <DetailStatLabel>Mejor marca</DetailStatLabel>
            </DetailStat>
            <DetailStat>
              <DetailStatValue>{selectedZone.lastVisit}</DetailStatValue>
              <DetailStatLabel>Última visita</DetailStatLabel>
            </DetailStat>
          </DetailStats>
          <RecentActivities>
            {selectedZone.activities.slice(0, 5).map(act => (
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
