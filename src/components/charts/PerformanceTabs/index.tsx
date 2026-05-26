'use client';

import React, { useState } from 'react';
import { MonthlyStats, PacePoint, CumulativePoint } from '@/types/stats';
import WeeklyDistanceChart from '../WeeklyDistanceChart';
import PaceEvolutionChart from '../PaceEvolutionChart';
import CumulativeDistanceChart from '../CumulativeDistanceChart';
import MonthlyComparisonChart from '../MonthlyComparisonChart';
import { ChartCard, ChartTitle } from '../shared/styled';
import { TabsRoot, TabBar, TabBtn, TabPanel } from './styled';

interface PerformanceTabsProps {
  monthly: MonthlyStats[];
  paceEvolution: PacePoint[];
  cumulativeDistance: CumulativePoint[];
}

const ALL_TABS = ['Distancia', 'Ritmo', 'Volumen', 'Comparación'] as const;
type Tab = (typeof ALL_TABS)[number];

const PerformanceTabs: React.FC<PerformanceTabsProps> = ({ monthly, paceEvolution, cumulativeDistance }) => {
  const tabs = ALL_TABS.filter((t) => t !== 'Ritmo' || paceEvolution.length > 0);
  const [active, setActive] = useState<Tab>(tabs[0]);

  return (
    <ChartCard>
      <ChartTitle>Cómo venís</ChartTitle>
      <TabsRoot>
        <TabBar>
          {tabs.map((tab) => (
            <TabBtn key={tab} $active={active === tab} onClick={() => setActive(tab)}>
              {tab}
            </TabBtn>
          ))}
        </TabBar>
        <TabPanel>
          {active === 'Distancia' && <WeeklyDistanceChart data={monthly} bare />}
          {active === 'Ritmo' && <PaceEvolutionChart data={paceEvolution} bare />}
          {active === 'Volumen' && <CumulativeDistanceChart data={cumulativeDistance} bare />}
          {active === 'Comparación' && <MonthlyComparisonChart data={monthly} bare />}
        </TabPanel>
      </TabsRoot>
    </ChartCard>
  );
};

export default PerformanceTabs;
