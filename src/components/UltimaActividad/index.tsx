'use client';

import React, { useMemo } from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeEnrichedLastActivity } from '@/lib/lastActivity';
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

// ── Polyline decoder (same as worldMap.ts) ─────────────────────────────────

function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let idx = 0, lat = 0, lon = 0;
  while (idx < encoded.length) {
    let b: number, shift = 0, result = 0;
    do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lon += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / 1e5, lon / 1e5]);
  }
  return coords;
}

// ── Mini map SVG ───────────────────────────────────────────────────────────

interface MiniMapProps {
  polyline: string;
}

const MiniMap: React.FC<MiniMapProps> = ({ polyline }) => {
  const path = useMemo(() => {
    try {
      const coords = decodePolyline(polyline);
      if (coords.length < 2) return null;

      const lats = coords.map(c => c[0]);
      const lons = coords.map(c => c[1]);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLon = Math.min(...lons), maxLon = Math.max(...lons);
      const ranLat = maxLat - minLat || 1;
      const ranLon = maxLon - minLon || 1;

      const W = 400, H = 100, PAD = 8;
      const points = coords.map(([lat, lon]) => {
        const x = PAD + ((lon - minLon) / ranLon) * (W - 2 * PAD);
        const y = (H - PAD) - ((lat - minLat) / ranLat) * (H - 2 * PAD);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      return points.join(' ');
    } catch {
      return null;
    }
  }, [polyline]);

  if (!path) return <MapNoData>Sin mapa disponible</MapNoData>;

  return (
    <MapSvg viewBox="0 0 400 100" preserveAspectRatio="xMidYMid meet">
      <polyline
        points={path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
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
