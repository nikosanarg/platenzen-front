'use client';

import { useStravaData } from '@/hooks/useStravaData';
import AchievementShowcase from '@/components/AchievementShowcase';

export default function AchievementsPage() {
  const { activities, stats } = useStravaData();

  return <AchievementShowcase activities={activities} stats={stats} />;
}
