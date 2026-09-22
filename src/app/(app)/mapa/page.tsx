'use client';

import { useStravaData } from '@/hooks/useStravaData';
import TuMundo from '@/components/TuMundo';

export default function MapaPage() {
  const { activities } = useStravaData();

  return <TuMundo activities={activities} />;
}
