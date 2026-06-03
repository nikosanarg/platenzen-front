'use client';

import React, { useMemo } from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeEnrichedLastActivity } from '@/lib/lastActivity';
import { decodePolyline } from '@/lib/polylineDecoder';
import { getTilesForBounds } from '@/lib/osmTiles';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  Root,
  Card,
  ActivityHeader,
  ActivityName,
  ActivityDate,
  StatsRow,
  StatItem,
  StatValue,
  StatLabel,
  MapContainer,
  MapSvg,
  MapNoData,
  Divider,
  XPSection,
  XPHeadRow,
  XPBig,
  XPDetails,
  XPChip,
  DNAImpactRow,
  DNALabel,
  DNAChip,
  LevelUpBadge,
  ComparisonRow,
  AchievementList,
  AchievementChip,
  StravaLink,
  SectionSubtitle,
} from './styled';

// ── Mini map SVG ───────────────────────────────────────────────────────────

const MAP_SIZE = 400;
const MAP_PAD = 20;

interface MiniMapProps {
  polyline: string;
}

const MiniMap: React.FC<MiniMapProps> = ({ polyline }) => {
  const result = useMemo(() => {
    try {
      const coords = decodePolyline(polyline);
      if (coords.length < 2) return null;

      const lats = coords.map(c => c[0]);
      const lons = coords.map(c => c[1]);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLon = Math.min(...lons), maxLon = Math.max(...lons);

      // Compute projected coordinates (equirectangular).
      // Using the same scale for both axes prevents the route from being
      // distorted when the bounding box is not square.
      const dLat = maxLat - minLat || 0.001;
      const dLon = maxLon - minLon || 0.001;

      const project = (lat: number, lon: number): [number, number] => {
        const x = MAP_PAD + ((lon - minLon) / dLon) * (MAP_SIZE - 2 * MAP_PAD);
        const y = MAP_SIZE - MAP_PAD - ((lat - minLat) / dLat) * (MAP_SIZE - 2 * MAP_PAD);
        return [x, y];
      };

      const points = coords.map(([lat, lon]) => {
        const [x, y] = project(lat, lon);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });

      // Get OSM tiles for this bounding box
      const padLat = dLat * 0.15;
      const padLon = dLon * 0.15;
      const tiles = getTilesForBounds(
        minLat - padLat, maxLat + padLat,
        minLon - padLon, maxLon + padLon,
        4,
      );

      // Project tile corners into the same SVG space
      const projectedTiles = tiles.map(tile => {
        const [x1, y1] = project(tile.nwLat, tile.nwLon);
        const [x2, y2] = project(tile.seLat, tile.seLon);
        return { ...tile, svgX: x1, svgY: y1, svgW: x2 - x1, svgH: y2 - y1 };
      });

      return { path: points.join(' '), projectedTiles };
    } catch {
      return null;
    }
  }, [polyline]);

  if (!result) return <MapNoData>Sin mapa disponible</MapNoData>;

  return (
    <MapSvg viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`} preserveAspectRatio="xMidYMid meet">
      {/* OSM tile background */}
      {result.projectedTiles.map(tile => (
        <image
          key={`${tile.tx}-${tile.ty}`}
          href={tile.url}
          x={tile.svgX}
          y={tile.svgY}
          width={tile.svgW}
          height={tile.svgH}
          preserveAspectRatio="none"
          style={{ filter: 'brightness(0.35) saturate(0.5)', opacity: 0.85 }}
        />
      ))}
      {/* Route polyline */}
      <polyline
        points={result.path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.95}
      />
    </MapSvg>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

interface UltimaActividadProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const UltimaActividad: React.FC<UltimaActividadProps> = ({ activities, stats }) => {
  const enriched = useMemo(
    () => computeEnrichedLastActivity(activities, stats),
    [activities, stats]
  );

  if (!enriched) return null;

  const { activity, distanceKm, pace, durationLabel, dateLabel, stravaUrl,
    xpEarned, xpDetails, dnaImpact, prevLevel, currentLevel,
    comparison, newAchievements } = enriched;

  const polyline = activity.map?.summary_polyline;
  const hasDNAImpact = dnaImpact.length > 0;

  return (
    <Root>
      <SectionTitle>Última actividad</SectionTitle>
      <Card>
        {/* Header */}
        <ActivityHeader>
          <ActivityName>{activity.name}</ActivityName>
          <ActivityDate>{dateLabel}</ActivityDate>
        </ActivityHeader>

        {/* Sport stats */}
        <StatsRow>
          <StatItem>
            <StatValue>{distanceKm} km</StatValue>
            <StatLabel>Distancia</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{pace}</StatValue>
            <StatLabel>Ritmo</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{durationLabel}</StatValue>
            <StatLabel>Tiempo</StatLabel>
          </StatItem>
        </StatsRow>

        {/* Mini map */}
        <MapContainer>
          {polyline ? (
            <MiniMap polyline={polyline} />
          ) : (
            <MapNoData>Sin ruta disponible</MapNoData>
          )}
        </MapContainer>

        <Divider />

        {/* XP earned */}
        <XPSection>
          <SectionSubtitle>Platenzen</SectionSubtitle>
          <XPHeadRow>
            <XPBig>+{xpEarned} XP</XPBig>
          </XPHeadRow>
          {xpDetails.length > 0 && (
            <XPDetails>
              {xpDetails.map((d, i) => (
                <XPChip key={i}>+{d.value} {d.label}</XPChip>
              ))}
            </XPDetails>
          )}
        </XPSection>

        {/* DNA impact */}
        {hasDNAImpact && (
          <DNAImpactRow>
            <DNALabel>Impacto en ADN:</DNALabel>
            {dnaImpact.map(imp => (
              <DNAChip key={imp.attribute} $positive={imp.delta > 0}>
                {imp.attribute} {imp.delta > 0 ? `+${imp.delta}` : imp.delta}
              </DNAChip>
            ))}
          </DNAImpactRow>
        )}

        {/* Level up */}
        {prevLevel !== null && (
          <LevelUpBadge>
            ⬆ Nivel {prevLevel} → Nivel {currentLevel}
          </LevelUpBadge>
        )}

        {/* Comparison */}
        {comparison && (
          <ComparisonRow $positive={comparison.positive}>
            {comparison.positive ? '⚡' : '📉'} {comparison.label}
          </ComparisonRow>
        )}

        {/* New achievements */}
        {newAchievements.length > 0 && (
          <AchievementList>
            {newAchievements.map((ach, i) => (
              <AchievementChip key={i}>🏆 {ach.name}</AchievementChip>
            ))}
          </AchievementList>
        )}

        {/* Strava link */}
        <StravaLink href={stravaUrl} target="_blank" rel="noopener noreferrer">
          Ver en Strava ↗
        </StravaLink>
      </Card>
    </Root>
  );
};

export default UltimaActividad;
