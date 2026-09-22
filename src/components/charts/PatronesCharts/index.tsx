'use client';

import React, { useState } from 'react';
import { ProcessedStats } from '@/types/stats';
import HourlyDistributionChart from '../HourlyDistributionChart';
import WeekdayDistributionChart from '../WeekdayDistributionChart';
import DistanceRitmoChart from '../DistanceRitmoChart';
import MonthlyComparisonChart from '../MonthlyComparisonChart';
import PerformanceTabs from '../PerformanceTabs';
import { ChartCard, ChartTitle } from '../shared/styled';
import { TabsRoot, TabBar, TabBtn, TabPanel } from '../PerformanceTabs/styled';
import { PatternsGrid } from '@/components/Dashboard/styled';
import { DesktopOnly, MobileOnly } from './styled';

interface PatronesChartsProps {
  stats: ProcessedStats;
}

const MOBILE_TABS = ['Distancia/Ritmo', 'Comparación', 'Por hora', 'Por día'] as const;
type MobileTab = (typeof MOBILE_TABS)[number];

/**
 * En escritorio hay lugar para tres tarjetas lado a lado. En el teléfono no
 * —cada una se reduce a una tira ilegible— así que ahí se consolidan en una
 * sola tarjeta con cuatro pestañas: el mismo contenido, leído de a uno.
 */
const PatronesCharts: React.FC<PatronesChartsProps> = ({ stats }) => {
  const [active, setActive] = useState<MobileTab>(MOBILE_TABS[0]);

  return (
    <>
      <DesktopOnly>
        <PatternsGrid>
          <HourlyDistributionChart data={stats.hourlyDistribution} />
          <WeekdayDistributionChart data={stats.weekdayDistribution} />
          <PerformanceTabs monthly={stats.monthly} />
        </PatternsGrid>
      </DesktopOnly>

      <MobileOnly>
        <ChartCard>
          <ChartTitle>Cómo venís</ChartTitle>
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
              {active === 'Por hora' && <HourlyDistributionChart data={stats.hourlyDistribution} bare />}
              {active === 'Por día' && <WeekdayDistributionChart data={stats.weekdayDistribution} bare />}
            </TabPanel>
          </TabsRoot>
        </ChartCard>
      </MobileOnly>
    </>
  );
};

export default PatronesCharts;
