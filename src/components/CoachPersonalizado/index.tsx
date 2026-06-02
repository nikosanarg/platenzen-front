'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeCoachRecommendation, RecommendationType } from '@/lib/coach';
import { computeFormShape } from '@/lib/formShape';
import { computeMomentum } from '@/lib/momentum';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  CoachRoot,
  UnifiedCard,
  CardSection,
  CoachBodyRow,
  CoachBodyLeft,
  CoachImage,
  CoachHeader,
  CoachIcon,
  CoachHeadText,
  LoadStateLabel,
  RecommendationLabel,
  MotivoBlock,
  MotivoLine,
  TooltipWrapper,
  TooltipTrigger,
  TooltipPopup,
  TooltipTitle,
  TooltipRow,
  TooltipKey,
  TooltipVal,
  FormaHeader,
  StateBadge,
  FormaAvg,
  StatsRow,
  StatPill,
  PillValue,
  PillLabel,
  ChartLabel,
  ChartWrap,
  SharpIncreaseNote,
  ObsList,
  ObsItem,
} from './styled';

const TYPE_ICONS: Record<RecommendationType, string> = {
  descanso: '🛌',
  regenerativa: '🚶',
  normal: '🏃',
  larga: '🗺️',
  tempo: '⚡',
  velocidad: '🚀',
};

const FORMA_STATE_LABELS = {
  ascenso: '↑ En ascenso',
  estable: '→ Estable',
  descenso: '↓ En descenso',
};

interface CoachPersonalizadoProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

function formatPace(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}/km`;
}

// ── EstadoActual observations ──────────────────────────────────────────────

function buildObservations(stats: ProcessedStats): React.ReactNode[] {
  const obs: React.ReactNode[] = [];

  const momentum = computeMomentum(stats.weekly);
  if (momentum) {
    const avg = Math.round(momentum.recentAvgKm * 10) / 10;
    const pct = Math.abs(Math.round(momentum.pctChange));
    if (momentum.state === 'subiendo') {
      obs.push(<>Promediaste <strong>{avg} km</strong> por semana en las últimas cuatro, un {pct}% más que el bloque anterior.</>);
    } else if (momentum.state === 'bajando') {
      obs.push(<>Promediaste <strong>{avg} km</strong> por semana en las últimas cuatro, un {pct}% por debajo del bloque anterior.</>);
    } else {
      obs.push(<>Promediaste <strong>{avg} km</strong> por semana en las últimas cuatro semanas.</>);
    }
  } else if (stats.weeklyAvgDistance > 0) {
    obs.push(<>Tu promedio semanal es de <strong>{Math.round(stats.weeklyAvgDistance * 10) / 10} km</strong>.</>);
  }

  const recentWeeks = stats.weekly.slice(-12);
  const activeWeeks = recentWeeks.filter(w => w.distance > 0).length;
  if (recentWeeks.length >= 4 && activeWeeks > 0) {
    obs.push(<>Corriste en <strong>{activeWeeks} de las últimas {recentWeeks.length} semanas</strong>.</>);
  }

  if (obs.length < 3) {
    if (stats.currentStreak >= 3) {
      obs.push(<>Llevás <strong>{stats.currentStreak} días activos seguidos</strong>.</>);
    } else if (stats.paceEvolution.length >= 3) {
      const recent = stats.paceEvolution.slice(-3);
      const avgPace = recent.reduce((s, p) => s + p.pace, 0) / recent.length;
      obs.push(<>Tu ritmo promedio en las últimas salidas fue de <strong>{formatPace(Math.round(avgPace))}</strong>.</>);
    } else if (stats.hourlyDistribution.length > 0) {
      const topHour = stats.hourlyDistribution.reduce((a, b) => (a.count > b.count ? a : b));
      obs.push(<>Tu hora de salida más frecuente es a las <strong>{topHour.label}</strong>.</>);
    }
  }

  return obs.slice(0, 3);
}

// ── Main component ─────────────────────────────────────────────────────────

const CoachPersonalizado: React.FC<CoachPersonalizadoProps> = ({ activities, stats }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const rec = computeCoachRecommendation(activities, stats);
  const forma = computeFormShape(activities, stats);
  const observations = buildObservations(stats);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltipVisible(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const v = rec.variables;
  const hasSharpIncrease = forma?.weeklyChart.some(w => w.hasSharpIncrease) ?? false;

  return (
    <CoachRoot>
      <SectionTitle>Coach personalizado</SectionTitle>

      <UnifiedCard>
        {/* ── Coach recommendation ── */}
        <CardSection>
          <CoachBodyRow>
            <CoachBodyLeft>
              <CoachHeader>
                <CoachIcon>{TYPE_ICONS[rec.type]}</CoachIcon>
                <CoachHeadText>
                  <LoadStateLabel>Estado actual: {rec.loadStateLabel}</LoadStateLabel>
                  <RecommendationLabel>{rec.label}</RecommendationLabel>
                </CoachHeadText>
              </CoachHeader>

              {rec.motivo.length > 0 && (
                <MotivoBlock>
                  {rec.motivo.map((line, i) => (
                    <MotivoLine key={i}>{line}</MotivoLine>
                  ))}
                </MotivoBlock>
              )}

              <TooltipWrapper ref={tooltipRef}>
                <TooltipTrigger onClick={() => setTooltipVisible(v2 => !v2)}>
                  ¿Cómo se calculó?
                </TooltipTrigger>

                <TooltipPopup $visible={tooltipVisible}>
                  <TooltipTitle>Variables utilizadas</TooltipTitle>
                  <TooltipRow>
                    <TooltipKey>Carga ponderada 14 días</TooltipKey>
                    <TooltipVal>{v.weightedLoad} km</TooltipVal>
                  </TooltipRow>
                  <TooltipRow>
                    <TooltipKey>Carga base semanal</TooltipKey>
                    <TooltipVal>{v.baselineKm} km</TooltipVal>
                  </TooltipRow>
                  <TooltipRow>
                    <TooltipKey>Ratio carga/base</TooltipKey>
                    <TooltipVal>{v.loadRatio !== null ? `×${v.loadRatio}` : '—'}</TooltipVal>
                  </TooltipRow>
                  <TooltipRow>
                    <TooltipKey>Mayor actividad reciente</TooltipKey>
                    <TooltipVal>{v.biggestRecentKm > 0 ? `${v.biggestRecentKm} km` : '—'}</TooltipVal>
                  </TooltipRow>
                  <TooltipRow>
                    <TooltipKey>Días sin correr</TooltipKey>
                    <TooltipVal>{v.daysSinceLastRun >= 999 ? '—' : `${v.daysSinceLastRun}d`}</TooltipVal>
                  </TooltipRow>
                </TooltipPopup>
              </TooltipWrapper>
            </CoachBodyLeft>

            <CoachImage src="/assets/coach_platenzen.png" alt="Coach Platenzen" />
          </CoachBodyRow>
        </CardSection>

        {/* ── Estado de forma ── */}
        {forma && (
          <CardSection>
            <FormaHeader>
              <StateBadge $state={forma.state}>
                {FORMA_STATE_LABELS[forma.state]}
              </StateBadge>
              <FormaAvg>
                Promedio semanal: <strong>{forma.recentWeeklyAvgKm} km</strong>
              </FormaAvg>
            </FormaHeader>

            {forma.weeklyChart.length >= 4 && (
              <>
                <StatsRow>
                  <StatPill>
                    <PillValue $positive={forma.volumeChangePct > 0} $negative={forma.volumeChangePct < 0}>
                      {forma.volumeChangePct > 0 ? '+' : ''}{forma.volumeChangePct}% volumen
                    </PillValue>
                    <PillLabel>vs. 4 sem. anteriores</PillLabel>
                  </StatPill>

                  {forma.consistencyChangePct !== 0 && (
                    <StatPill>
                      <PillValue $positive={forma.consistencyChangePct > 0} $negative={forma.consistencyChangePct < 0}>
                        {forma.consistencyChangePct > 0 ? '+' : ''}{forma.consistencyChangePct}% consistencia
                      </PillValue>
                      <PillLabel>semanas activas</PillLabel>
                    </StatPill>
                  )}

                  {forma.paceChangeSec !== 0 && (
                    <StatPill>
                      <PillValue $positive={forma.paceChangeSec > 0} $negative={forma.paceChangeSec < 0}>
                        {forma.paceChangeSec > 0
                          ? `Ritmo ${forma.paceChangeSec}" más rápido`
                          : `Ritmo ${Math.abs(forma.paceChangeSec)}" más lento`}
                      </PillValue>
                      <PillLabel>últimas 5 vs. anteriores</PillLabel>
                    </StatPill>
                  )}
                </StatsRow>

                <ChartLabel>Carga semanal — últimos 6 meses</ChartLabel>
                <ChartWrap>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forma.weeklyChart} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        interval={3}
                      />
                      <YAxis
                        tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `${v}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          color: 'var(--text-primary)',
                          fontSize: 12,
                        }}
                        formatter={(value) => {
                          const num = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
                          return [`${num} km`, 'Distancia'] as [string, string];
                        }}
                        cursor={{ fill: 'var(--accent-muted)' }}
                      />
                      <Bar dataKey="km" radius={[3, 3, 0, 0]} maxBarSize={14}>
                        {forma.weeklyChart.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.isRecord ? '#4ade80' : entry.hasSharpIncrease ? 'var(--warning)' : 'var(--accent)'}
                            opacity={entry.km === 0 ? 0.2 : 0.85}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartWrap>
                {hasSharpIncrease && (
                  <SharpIncreaseNote>
                    ⚠ Aumento brusco de carga detectado — recordá mantener una progresión gradual para evitar lesiones.
                  </SharpIncreaseNote>
                )}
              </>
            )}
          </CardSection>
        )}

        {/* ── Estado actual (observations) ── */}
        {observations.length > 0 && (
          <CardSection>
            <ObsList>
              {observations.map((obs, i) => (
                <ObsItem key={i}>{obs}</ObsItem>
              ))}
            </ObsList>
          </CardSection>
        )}
      </UnifiedCard>
    </CoachRoot>
  );
};

export default CoachPersonalizado;
