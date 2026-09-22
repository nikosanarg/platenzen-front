'use client';

import React, { useState } from 'react';
import { MonthlyStats } from '@/types/stats';
import DistanceRitmoChart from '../DistanceRitmoChart';
import MonthlyComparisonChart from '../MonthlyComparisonChart';
import { ChartCard, ChartTitle } from '../shared/styled';
import { TabsRoot, TabBar, TabBtn, TabPanel } from './styled';

interface PerformanceTabsProps {
  monthly: MonthlyStats[];
}

/**
 * "Volumen" (distancia acumulada) salió: era la misma información que
 * "Distancia" en otra forma, y competía por el mismo lugar. Distancia y
 * Ritmo dejaron de ser dos pestañas —el ritmo se lee como línea encima de
 * las barras de distancia, en `DistanceRitmoChart`— así que acá quedan dos.
 */
const ALL_TABS = ['Distancia/Ritmo', 'Comparación'] as const;
type Tab = (typeof ALL_TABS)[number];

const PerformanceTabs: React.FC<PerformanceTabsProps> = ({ monthly }) => {
  const [active, setActive] = useState<Tab>(ALL_TABS[0]);

  return (
    <ChartCard>
      <ChartTitle>Cómo venís</ChartTitle>
      <TabsRoot>
        <TabBar>
          {ALL_TABS.map((tab) => (
            <TabBtn key={tab} $active={active === tab} onClick={() => setActive(tab)}>
              {tab}
            </TabBtn>
          ))}
        </TabBar>
        <TabPanel>
          {active === 'Distancia/Ritmo' && <DistanceRitmoChart data={monthly} bare />}
          {active === 'Comparación' && <MonthlyComparisonChart data={monthly} bare />}
        </TabPanel>
      </TabsRoot>
    </ChartCard>
  );
};

export default PerformanceTabs;
