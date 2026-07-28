'use client';

import { useStravaData } from '@/hooks/useStravaData';
import PeriodComparator from '@/components/PeriodComparator';
import RacePredictorTable from '@/components/RacePredictorTable';

export default function ComparativePage() {
  const { activities } = useStravaData();

  return (
    <>
      <PeriodComparator activities={activities} />
      <RacePredictorTable activities={activities} />
    </>
  );
}
