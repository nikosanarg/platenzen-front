'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipValueType } from 'recharts';
import { HourCount } from '@/types/stats';
import { ChartCard, ChartTitle } from '../shared/styled';

interface HourlyDistributionChartProps {
  data: HourCount[];
}

const HourlyDistributionChart: React.FC<HourlyDistributionChartProps> = ({ data }) => {
  return (
    <ChartCard>
      <ChartTitle>A qué hora corrés</ChartTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => v % 4 === 0 ? `${v}h` : ''}
          />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
            formatter={(value: TooltipValueType | undefined, _: string | number | undefined, props: { payload?: HourCount }) => [value ?? 0, props.payload?.label ?? ''] as [TooltipValueType, string]}
            cursor={{ fill: 'var(--accent-muted)' }}
          />
          <Bar dataKey="count" fill="var(--chart-2)" radius={[3, 3, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default HourlyDistributionChart;
