'use client';

import React, { useMemo } from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeCoachAnalisis, DayKind } from '@/lib/coachAnalisis';
import { decodePolyline } from '@/lib/polylineDecoder';
import { getTilesForBounds } from '@/lib/osmTiles';
import {
  IconRun, IconCheck, IconTrendUp, IconMedal, IconRoute,
  IconFlame, IconCalendar, IconHourglass,
} from '@/components/Icon';
import {
  Root, Card, CardHead, HeadTitle, HeadSubtitle,
  MainGrid, ColActivity, ColInsights, ColAgenda, ColTitle,
  ActivityHead, ActivityIcon, ActivityName, ActivityDate,
  StatsRow, StatItem, StatValue, StatUnit, StatLabel,
  MapContainer, MapSvg, MapNoData, StravaLink,
  InsightList, InsightItem, InsightIcon,
  HighlightGrid, HighlightCardBox, HighlightIcon, HighlightBody,
  HighlightValue, HighlightLabel, HighlightSub,
  NextList, NextItem, NextDay, NextRow, NextIcon, NextLabel, NextSep, TodayItem,
  BottomStrip, BottomCell, BottomIcon, BottomBody, BottomLabel, BottomValue, BottomSub,
  Verdict, VerdictStar, VerdictTitle, VerdictDetail,
} from './styled';

// ── Mini map (ported from UltimaActividad) ───────────────────────────────────

const MAP_W = 480;
const MAP_H = 270;
const MAP_PAD = 18;

const MiniMap: React.FC<{ polyline: string }> = ({ polyline }) => {
  const result = useMemo(() => {
    try {
      const coords = decodePolyline(polyline);
      if (coords.length < 2) return null;

      const lats = coords.map(c => c[0]);
      const lons = coords.map(c => c[1]);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLon = Math.min(...lons), maxLon = Math.max(...lons);
      const dLat = maxLat - minLat || 0.001;
      const dLon = maxLon - minLon || 0.001;

      // Preserve aspect ratio: use a single scale so the route isn't stretched.
      const scale = Math.min((MAP_W - 2 * MAP_PAD) / dLon, (MAP_H - 2 * MAP_PAD) / dLat);
      const offsetX = (MAP_W - dLon * scale) / 2;
      const offsetY = (MAP_H - dLat * scale) / 2;

      const project = (lat: number, lon: number): [number, number] => {
        const x = offsetX + (lon - minLon) * scale;
        const y = MAP_H - offsetY - (lat - minLat) * scale;
        return [x, y];
      };

      const points = coords.map(([lat, lon]) => {
        const [x, y] = project(lat, lon);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });

      const padLat = dLat * 0.15;
      const padLon = dLon * 0.15;
      const tiles = getTilesForBounds(
        minLat - padLat, maxLat + padLat,
        minLon - padLon, maxLon + padLon,
        4,
      );
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
    <MapSvg viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid slice">
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

// ── Icon pickers ─────────────────────────────────────────────────────────────

const HIGHLIGHT_ICONS = {
  trend: IconTrendUp,
  medal: IconMedal,
  route: IconRoute,
  flame: IconFlame,
  calendar: IconCalendar,
} as const;

const BOTTOM_ICONS = {
  calendar: IconCalendar,
  route: IconRoute,
  flame: IconFlame,
  trend: IconTrendUp,
  medal: IconMedal,
} as const;

function dayIcon(kind: DayKind) {
  if (kind === 'done') return <IconCheck size={15} color="currentColor" />;
  if (kind === 'run') return <IconRun size={15} color="currentColor" />;
  if (kind === 'none') return <IconCalendar size={15} color="currentColor" />;
  return <IconHourglass size={15} color="currentColor" />;
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const CoachAnalisis: React.FC<Props> = ({ activities, stats }) => {
  const data = useMemo(() => computeCoachAnalisis(activities, stats), [activities, stats]);
  if (!data) return null;

  const { activity, insights, highlights, agenda, bottomStats, verdict } = data;

  return (
    <Root>
      <Card>
        <CardHead>
          <HeadTitle>Análisis del Coach</HeadTitle>
          <HeadSubtitle>Última actividad · resumen e impacto</HeadSubtitle>
        </CardHead>

        <MainGrid>
          {/* ── Column 1: activity ── */}
          <ColActivity>
            <ActivityHead>
              <ActivityIcon>
                <IconRun size={22} color="var(--accent)" />
              </ActivityIcon>
              <div>
                <ActivityName>{activity.name}</ActivityName>
                <ActivityDate>{activity.dateTimeLabel}</ActivityDate>
              </div>
            </ActivityHead>

            <StatsRow>
              <StatItem>
                <StatValue>{activity.distanceKm}<StatUnit>km</StatUnit></StatValue>
                <StatLabel>Distancia</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{activity.durationLabel}</StatValue>
                <StatLabel>Tiempo</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{activity.pace.replace('/km', '')}<StatUnit>/km</StatUnit></StatValue>
                <StatLabel>Ritmo prom.</StatLabel>
              </StatItem>
            </StatsRow>

            <MapContainer>
              {activity.polyline
                ? <MiniMap polyline={activity.polyline} />
                : <MapNoData>Sin ruta disponible</MapNoData>}
            </MapContainer>

            <StravaLink href={activity.stravaUrl} target="_blank" rel="noopener noreferrer">
              Ver en Strava ↗
            </StravaLink>
          </ColActivity>

          {/* ── Column 2: insights ── */}
          <ColInsights>
            <ColTitle>¿Qué nos dice esta salida?</ColTitle>
            <InsightList>
              {insights.map((ins, i) => (
                <InsightItem key={i}>
                  <InsightIcon $tone={ins.tone}>
                    <IconCheck size={13} color="currentColor" />
                  </InsightIcon>
                  {ins.text}
                </InsightItem>
              ))}
            </InsightList>

            <HighlightGrid>
              {highlights.map((h, i) => {
                const Ico = HIGHLIGHT_ICONS[h.icon];
                return (
                  <HighlightCardBox key={i}>
                    <HighlightIcon $tone={h.tone}>
                      <Ico size={18} color="currentColor" />
                    </HighlightIcon>
                    <HighlightBody>
                      <HighlightValue $tone={h.tone}>{h.value}</HighlightValue>
                      <HighlightLabel>{h.label}</HighlightLabel>
                      <HighlightSub>{h.sub}</HighlightSub>
                    </HighlightBody>
                  </HighlightCardBox>
                );
              })}
            </HighlightGrid>
          </ColInsights>

          {/* ── Column 3: hoy + próximas 72h ── */}
          <ColAgenda>
            <NextList>
              {agenda.map((s, i) => (
                <React.Fragment key={i}>
                  {i === 1 && <NextSep />}
                  <NextItem as={i === 0 ? TodayItem : undefined}>
                    <NextDay>{s.day}</NextDay>
                    <NextRow>
                      <NextIcon $kind={s.kind}>{dayIcon(s.kind)}</NextIcon>
                      <NextLabel $muted={s.kind === 'rest' || s.kind === 'none'}>
                        {s.label}
                      </NextLabel>
                    </NextRow>
                  </NextItem>
                </React.Fragment>
              ))}
            </NextList>
          </ColAgenda>

          {/* ── Verdict (below insights + agenda, right of the map) ── */}
          <Verdict>
            <VerdictStar>✦</VerdictStar>
            <div>
              <VerdictTitle>{verdict.title}</VerdictTitle>
              <VerdictDetail>{verdict.detail}</VerdictDetail>
            </div>
          </Verdict>
        </MainGrid>

        {/* ── Bottom stat strip ── */}
        <BottomStrip>
          {bottomStats.map((b, i) => {
            const Ico = BOTTOM_ICONS[b.icon];
            return (
              <BottomCell key={i}>
                <BottomIcon $tone={b.tone}>
                  <Ico size={18} color="currentColor" />
                </BottomIcon>
                <BottomBody>
                  <BottomLabel>{b.label}</BottomLabel>
                  <BottomValue>{b.value}</BottomValue>
                  <BottomSub $tone={b.tone}>{b.sub}</BottomSub>
                </BottomBody>
              </BottomCell>
            );
          })}
        </BottomStrip>
      </Card>
    </Root>
  );
};

export default CoachAnalisis;
