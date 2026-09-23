'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipValueType,
} from 'recharts';
import { MonthlyStats } from '@/types/stats';
import { secPerKmToString } from '@/utils/pace';
import { ChartCard, ChartTitle, ChartArea } from '../shared/styled';

interface DistanceRitmoChartProps {
  data: MonthlyStats[];
  bare?: boolean;
}

interface Point {
  label: string;
  distance: number;
  pace: number | null;
}

/**
 * El ritmo promedio del mes, derivado de lo que el mes ya trae —tiempo total
 * sobre distancia total—, no un dato nuevo pedido a Strava. Un mes sin
 * kilómetros no tiene ritmo que mostrar: `null`, no un cero que sugeriría
 * "corriste a velocidad infinita".
 */
function toPoint(m: MonthlyStats): Point {
  return {
    label: m.label,
    distance: m.distance,
    pace: m.distance > 0 ? m.time / m.distance : null,
  };
}

const DistanceRitmoChart: React.FC<DistanceRitmoChartProps> = ({ data, bare }) => {
  const recent = data.slice(-12).map(toPoint);

  return (
    <ChartCard $bare={bare}>
      <ChartTitle>Distancia y ritmo, mes a mes</ChartTitle>
      <ChartArea>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={recent} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="distancia"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}km`}
            />
            <YAxis
              yAxisId="ritmo"
              orientation="right"
              reversed
              domain={['dataMin - 20', 'dataMax + 20']}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => secPerKmToString(v).replace(' /km', '')}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
              formatter={(value: TooltipValueType | undefined, name: string | number | undefined) => {
                const num = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
                if (name === 'pace') return [secPerKmToString(num), 'Ritmo'] as [string, string];
                return [`${num.toFixed(1)} km`, 'Distancia'] as [string, string];
              }}
              cursor={{ fill: 'var(--accent-muted)' }}
            />
            <Bar yAxisId="distancia" dataKey="distance" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Line
              yAxisId="ritmo"
              type="monotone"
              dataKey="pace"
              stroke="var(--accent)"
              strokeWidth={3}
              strokeLinecap="round"
              dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }}
              activeDot={{ r: 4, fill: 'var(--accent)' }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartArea>
    </ChartCard>
  );
};

export default DistanceRitmoChart;
