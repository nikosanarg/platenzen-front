'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipValueType,
} from 'recharts';
import { MonthlyStats } from '@/types/stats';
import { ChartCard, ChartTitle } from '../shared/styled';

interface WeeklyDistanceChartProps {
  data: MonthlyStats[];
}

const WeeklyDistanceChart: React.FC<WeeklyDistanceChartProps> = ({ data }) => {
  const recent = data.slice(-12);

  return (
    <ChartCard>
      <ChartTitle>Tu distancia mes a mes</ChartTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={recent} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}km`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
            formatter={(value: TooltipValueType | undefined) => {
              const num = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
              return [`${num.toFixed(1)} km`, 'Distancia'] as [string, string];
            }}
            cursor={{ fill: 'var(--accent-muted)' }}
          />
          <Bar dataKey="distance" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default WeeklyDistanceChart;
