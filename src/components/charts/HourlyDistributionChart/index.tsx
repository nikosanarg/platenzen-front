'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipValueType } from 'recharts';
import { HourCount } from '@/types/stats';
import { ChartCard, ChartTitle, ChartArea } from '../shared/styled';

interface HourlyDistributionChartProps {
  data: HourCount[];
}

const HourlyDistributionChart: React.FC<HourlyDistributionChartProps> = ({ data }) => {
  const trimmedData = React.useMemo(() => {
    const firstIdx = data.findIndex(d => d.count > 0);
    const lastIdx = data.reduce((acc, d, i) => d.count > 0 ? i : acc, -1);
    if (firstIdx === -1) return data;
    return data.slice(firstIdx, lastIdx + 1);
  }, [data]);

  return (
    <ChartCard>
      <ChartTitle>Actividades por hora</ChartTitle>
      <ChartArea>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trimmedData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}h`}
              interval={1}
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
      </ChartArea>
    </ChartCard>
  );
};

export default HourlyDistributionChart;
