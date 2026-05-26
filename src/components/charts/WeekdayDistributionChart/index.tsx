'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, TooltipValueType } from 'recharts';
import { WeekdayCount } from '@/types/stats';
import { ChartCard, ChartTitle, ChartArea } from '../shared/styled';

interface WeekdayDistributionChartProps {
  data: WeekdayCount[];
}

const WeekdayDistributionChart: React.FC<WeekdayDistributionChartProps> = ({ data }) => {
  return (
    <ChartCard>
      <ChartTitle>Tus días más activos</ChartTitle>
      <ChartArea>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
              formatter={(value: TooltipValueType | undefined) => [value ?? 0, 'Actividades'] as [TooltipValueType, string]}
              cursor={{ fill: 'var(--accent-muted)' }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={40}>
              {data.map((entry) => (
                <Cell
                  key={`cell-${entry.day}`}
                  fill={entry.day === 0 || entry.day === 6 ? '#f5c842' : 'var(--chart-3)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartArea>
    </ChartCard>
  );
};

export default WeekdayDistributionChart;
