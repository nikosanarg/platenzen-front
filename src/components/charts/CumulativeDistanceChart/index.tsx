'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipValueType,
} from 'recharts';
import { CumulativePoint } from '@/types/stats';
import { ChartCard, ChartTitle, ChartArea } from '../shared/styled';

interface CumulativeDistanceChartProps {
  data: CumulativePoint[];
  bare?: boolean;
}

const CumulativeDistanceChart: React.FC<CumulativeDistanceChartProps> = ({ data, bare }) => {
  const sampled = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 100)) === 0 || i === data.length - 1);

  return (
    <ChartCard $bare={bare}>
      <ChartTitle>Lo que sumaste hasta hoy</ChartTitle>
      <ChartArea>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sampled} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}km`} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
              formatter={(value: TooltipValueType | undefined) => {
                const num = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
                return [`${num} km`, 'Acumulado'] as [string, string];
              }}
              cursor={{ stroke: 'var(--accent)', strokeWidth: 1 }}
            />
            <Area type="monotone" dataKey="cumulative" stroke="var(--accent)" strokeWidth={2} fill="url(#cumGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartArea>
    </ChartCard>
  );
};

export default CumulativeDistanceChart;
