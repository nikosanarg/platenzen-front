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
  Legend,
  TooltipValueType,
} from 'recharts';
import { MonthlyStats } from '@/types/stats';
import { ChartCard, ChartTitle } from '../shared/styled';

interface MonthlyComparisonChartProps {
  data: MonthlyStats[];
}

const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({ data }) => {
  const years = new Map<number, MonthlyStats[]>();
  for (const item of data) {
    const year = parseInt(item.month.slice(0, 4));
    const list = years.get(year) ?? [];
    list.push(item);
    years.set(year, list);
  }

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const chartData = months.map((label, i) => {
    const row: Record<string, number | string> = { month: label };
    for (const [year, items] of years) {
      const matchItem = items.find((it) => it.month.endsWith(`-${(i + 1).toString().padStart(2, '0')}`));
      row[year.toString()] = matchItem ? Math.round(matchItem.distance * 10) / 10 : 0;
    }
    return row;
  });

  const yearKeys = Array.from(years.keys()).sort();
  const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)'];

  return (
    <ChartCard>
      <ChartTitle>Comparativa anual</ChartTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}km`} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13 }}
            formatter={(value: TooltipValueType | undefined, name: string | number | undefined) => [`${value ?? 0} km`, String(name ?? '')] as [string, string]}
            cursor={{ fill: 'var(--accent-muted)' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
          {yearKeys.map((year, idx) => (
            <Bar key={year} dataKey={year.toString()} fill={COLORS[idx % COLORS.length]} radius={[3, 3, 0, 0]} maxBarSize={20} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export default MonthlyComparisonChart;
