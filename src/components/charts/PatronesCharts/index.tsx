'use client';

import React, { useState } from 'react';
import { ProcessedStats } from '@/types/stats';
import DayHourHeatmap from '../DayHourHeatmap';
import DistanceRitmoChart from '../DistanceRitmoChart';
import MonthlyComparisonChart from '../MonthlyComparisonChart';
import PerformanceTabs from '../PerformanceTabs';
import { ChartCard } from '../shared/styled';
import { TabsRoot, TabBar, TabBtn, TabPanel } from '../PerformanceTabs/styled';
import { PatternsGrid } from '@/components/Dashboard/styled';
import { DesktopOnly, MobileOnly } from './styled';

interface PatronesChartsProps {
  stats: ProcessedStats;
}

const MOBILE_TABS = ['Distancia/Ritmo', 'Comparación', 'Día y hora'] as const;
type MobileTab = (typeof MOBILE_TABS)[number];

/**
 * En escritorio hay lugar para dos tarjetas lado a lado. En el teléfono no
 * —cada una se reduce a una tira ilegible— así que ahí se consolidan en una
 * sola tarjeta con pestañas: el mismo contenido, leído de a uno.
 */
const PatronesCharts: React.FC<PatronesChartsProps> = ({ stats }) => {
  const [active, setActive] = useState<MobileTab>(MOBILE_TABS[0]);

  return (
    <>
      <DesktopOnly>
        <PatternsGrid>
          <DayHourHeatmap data={stats.dayHourDistribution} />
          <PerformanceTabs monthly={stats.monthly} />
        </PatternsGrid>
      </DesktopOnly>

      <MobileOnly>
        <ChartCard>
          <TabsRoot>
            <TabBar>
              {MOBILE_TABS.map((tab) => (
                <TabBtn key={tab} $active={active === tab} onClick={() => setActive(tab)}>
                  {tab}
                </TabBtn>
              ))}
            </TabBar>
            <TabPanel>
              {active === 'Distancia/Ritmo' && <DistanceRitmoChart data={stats.monthly} bare />}
              {active === 'Comparación' && <MonthlyComparisonChart data={stats.monthly} bare />}
              {active === 'Día y hora' && <DayHourHeatmap data={stats.dayHourDistribution} bare />}
            </TabPanel>
          </TabsRoot>
        </ChartCard>
      </MobileOnly>
    </>
  );
};

export default PatronesCharts;
