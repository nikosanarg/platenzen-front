'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipValueType } from 'recharts';
import { WeekdayCount } from '@/types/stats';
import { ChartCard, ChartTitle } from '../shared/styled';

interface WeekdayDistributionChartProps {
  data: WeekdayCount[];
}

const WeekdayDistributionChart: React.FC<WeekdayDistributionChartProps> = ({ data }) => {
  return (
    <ChartCard>
      <ChartTitle>Tus días más activos</ChartTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
            formatter={(value: TooltipValueType | undefined) => [value ?? 0, 'Actividades'] as [TooltipValueType, string]}
            cursor={{ fill: 'var(--accent-muted)' }}
          />
          <Bar dataKey="count" fill="var(--chart-3)" radius={[3, 3, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default WeekdayDistributionChart;
