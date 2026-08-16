'use client';

import { useStravaData } from '@/hooks/useStravaData';
import PersonajeCard from '@/components/PersonajeCard';
import CoachAnalisis from '@/components/CoachAnalisis';
import RecordHistorySection from '@/components/RecordHistorySection';
import InsightsSection from '@/components/InsightsSection';
import SesionesLegendarias from '@/components/SesionesLegendarias';
import HourlyDistributionChart from '@/components/charts/HourlyDistributionChart';
import WeekdayDistributionChart from '@/components/charts/WeekdayDistributionChart';
import PerformanceTabs from '@/components/charts/PerformanceTabs';
import CollapsibleSection from '@/components/CollapsibleSection';
import PersonalGoals from '@/components/PersonalGoals';
import ConsistencyPanel from '@/components/ConsistencyPanel';
import TuMundo from '@/components/TuMundo';
import { LegendaryGroup, PatternsGrid } from '@/components/Dashboard/styled';

export default function ProgresoPage() {
  const { activities, stats } = useStravaData();

  return (
    <>
      <PersonajeCard activities={activities} stats={stats} />

      <CoachAnalisis activities={activities} stats={stats} />

      <CollapsibleSection
        title="Objetivos y territorio"
        subtitle="metas propias, constancia y por dónde corrés"
        defaultOpen
      >
        <LegendaryGroup>
          <PersonalGoals activities={activities} stats={stats} />
          <ConsistencyPanel activities={activities} stats={stats} />
          <TuMundo activities={activities} />
        </LegendaryGroup>
      </CollapsibleSection>

      <LegendaryGroup>
        <RecordHistorySection activities={activities} />
        <SesionesLegendarias activities={activities} stats={stats} />
      </LegendaryGroup>

      <CollapsibleSection
        title="Patrones y Tendencias"
        subtitle="cómo, cuándo y cuánto entrenás"
        defaultOpen
      >
        <PatternsGrid>
          <HourlyDistributionChart data={stats.hourlyDistribution} />
          <WeekdayDistributionChart data={stats.weekdayDistribution} />
          <PerformanceTabs
            monthly={stats.monthly}
            paceEvolution={stats.paceEvolution}
            cumulativeDistance={stats.cumulativeDistance}
          />
        </PatternsGrid>
        <InsightsSection activities={activities} stats={stats} />
      </CollapsibleSection>
    </>
  );
}
