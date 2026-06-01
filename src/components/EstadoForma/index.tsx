'use client';

import React from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeFormShape, FormState } from '@/lib/formShape';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  FormaRoot,
  FormaCard,
  FormaHeader,
  StateBadge,
  FormaAvg,
  StatsRow,
  StatPill,
  PillValue,
  PillLabel,
  Divider,
  ChartSection,
  ChartLabel,
  ChartWrap,
  SharpIncreaseNote,
} from './styled';

interface EstadoFormaProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const STATE_LABELS: Record<FormState, string> = {
  ascenso: '↑ En ascenso',
  estable: '→ Estable',
  descenso: '↓ En descenso',
};

const EstadoForma: React.FC<EstadoFormaProps> = ({ activities, stats }) => {
  const data = computeFormShape(activities, stats);
  if (!data) return null;

  const hasSharpIncrease = data.weeklyChart.some(w => w.hasSharpIncrease);

  const volumePositive = data.volumeChangePct > 0;
  const volumeNegative = data.volumeChangePct < 0;
  const consistencyPositive = data.consistencyChangePct > 0;
  const consistencyNegative = data.consistencyChangePct < 0;
  const pacePositive = data.paceChangeSec > 0;
  const paceNegative = data.paceChangeSec < 0;

  return (
    <FormaRoot>
      <SectionTitle>Estado de forma</SectionTitle>
      <FormaCard>
        <FormaHeader>
          <StateBadge $state={data.state}>{STATE_LABELS[data.state]}</StateBadge>
          <FormaAvg>
            Promedio semanal: <strong>{data.recentWeeklyAvgKm} km</strong>
          </FormaAvg>
        </FormaHeader>

        <StatsRow>
          <StatPill>
            <PillValue $positive={volumePositive} $negative={volumeNegative}>
              {data.volumeChangePct > 0 ? '+' : ''}
              {data.volumeChangePct}% volumen
            </PillValue>
            <PillLabel>vs. 4 sem. anteriores</PillLabel>
          </StatPill>

          {data.consistencyChangePct !== 0 && (
            <StatPill>
              <PillValue $positive={consistencyPositive} $negative={consistencyNegative}>
                {data.consistencyChangePct > 0 ? '+' : ''}
                {data.consistencyChangePct}% consistencia
              </PillValue>
              <PillLabel>semanas activas</PillLabel>
            </StatPill>
          )}

          {data.paceChangeSec !== 0 && (
            <StatPill>
              <PillValue $positive={pacePositive} $negative={paceNegative}>
                {pacePositive
                  ? `Ritmo ${data.paceChangeSec}" más rápido`
                  : `Ritmo ${Math.abs(data.paceChangeSec)}" más lento`}
              </PillValue>
              <PillLabel>últimas 5 vs. anteriores</PillLabel>
            </StatPill>
          )}

          {data.paceChangeSec === 0 && (
            <StatPill>
              <PillValue>Ritmo estable</PillValue>
              <PillLabel>sin variación significativa</PillLabel>
            </StatPill>
          )}
        </StatsRow>

        {data.weeklyChart.length >= 4 && (
          <>
            <Divider />
            <ChartSection>
              <ChartLabel>Carga semanal — últimos 6 meses</ChartLabel>
              <ChartWrap>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.weeklyChart}
                    margin={{ top: 4, right: 0, left: -28, bottom: 0 }}
                  >
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
                      {data.weeklyChart.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.isRecord
                              ? '#4ade80'
                              : entry.hasSharpIncrease
                              ? 'var(--warning)'
                              : 'var(--accent)'
                          }
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
            </ChartSection>
          </>
        )}
      </FormaCard>
    </FormaRoot>
  );
};

export default EstadoForma;
