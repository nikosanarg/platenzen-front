'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, TooltipValueType } from 'recharts';
import { SportCount } from '@/types/stats';
import { ChartCard, ChartTitle } from '../shared/styled';

interface SportDistributionChartProps {
  data: SportCount[];
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];

const SportDistributionChart: React.FC<SportDistributionChartProps> = ({ data }) => {
  if (data.length === 0) return null;

  return (
    <ChartCard>
      <ChartTitle>Distribución por deporte</ChartTitle>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="sport"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            paddingAngle={2}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
            formatter={(value: TooltipValueType | undefined, name: string | number | undefined) => [value ?? 0, String(name ?? '')] as [TooltipValueType, string]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
            formatter={(value: string) => value}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default SportDistributionChart;
