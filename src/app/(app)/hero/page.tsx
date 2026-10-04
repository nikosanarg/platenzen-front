'use client';

import { useStravaData } from '@/hooks/useStravaData';
import HeroView from '@/components/HeroView';

export default function HeroPage() {
  const { activities, stats } = useStravaData();

  return <HeroView activities={activities} stats={stats} />;
}
