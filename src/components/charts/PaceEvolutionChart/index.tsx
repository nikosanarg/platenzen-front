'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipValueType,
} from 'recharts';
import { PacePoint } from '@/types/stats';
import { secPerKmToString } from '@/utils/pace';
import { ChartCard, ChartTitle, ChartArea } from '../shared/styled';

interface PaceEvolutionChartProps {
  data: PacePoint[];
  bare?: boolean;
}

const PaceEvolutionChart: React.FC<PaceEvolutionChartProps> = ({ data, bare }) => {
  if (data.length === 0) return null;

  const recent = data.slice(-50);

  return (
    <ChartCard $bare={bare}>
      <ChartTitle>Cómo evolucionó tu ritmo</ChartTitle>
      <ChartArea>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={recent} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              reversed
              tickFormatter={(v: number) => secPerKmToString(v).replace(' /km', '')}
            />
            <Tooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
              formatter={(value: TooltipValueType | undefined) => {
                const num = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
                return [secPerKmToString(num), 'Ritmo'] as [string, string];
              }}
              cursor={{ stroke: 'var(--accent)', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="pace"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--accent)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartArea>
    </ChartCard>
  );
};

export default PaceEvolutionChart;
