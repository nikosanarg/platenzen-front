import React from 'react';
import { StravaActivity } from '@/types/strava';
import ActivityCard from '@/components/ActivityCard';
import { SectionRoot, SectionTitle, TopGrid } from './styled';

interface TopActivitiesProps {
  activities: StravaActivity[];
}

const RUNNING_SPORTS = new Set(['Run', 'TrailRun', 'VirtualRun']);

function getTop(activities: StravaActivity[]): Array<{ activity: StravaActivity; highlight: string }> {
  if (activities.length === 0) return [];
  const results: Array<{ activity: StravaActivity; highlight: string }> = [];

  const byDistance = [...activities].sort((a, b) => b.distance - a.distance)[0];
  if (byDistance) results.push({ activity: byDistance, highlight: 'Mayor distancia' });

  const running = activities.filter((a) => RUNNING_SPORTS.has(a.sport_type || a.type) && a.average_speed > 0);
  if (running.length > 0) {
    const byPace = [...running].sort((a, b) => b.average_speed - a.average_speed)[0];
    if (byPace && byPace.id !== byDistance?.id) {
      results.push({ activity: byPace, highlight: 'Mejor ritmo' });
    }
  }

  const byTime = [...activities].sort((a, b) => b.moving_time - a.moving_time)[0];
  if (byTime && !results.find((r) => r.activity.id === byTime.id)) {
    results.push({ activity: byTime, highlight: 'Mayor duración' });
  }

  const byElevation = [...activities].sort((a, b) => b.total_elevation_gain - a.total_elevation_gain)[0];
  if (byElevation && !results.find((r) => r.activity.id === byElevation.id)) {
    results.push({ activity: byElevation, highlight: 'Mayor desnivel' });
  }

  return results.slice(0, 4);
}

const TopActivities: React.FC<TopActivitiesProps> = ({ activities }) => {
  const tops = getTop(activities);
  if (tops.length === 0) return null;

  return (
    <SectionRoot>
      <SectionTitle>Actividades destacadas</SectionTitle>
      <TopGrid>
        {tops.map(({ activity, highlight }) => (
          <ActivityCard key={`${activity.id}-${highlight}`} activity={activity} highlight={highlight} />
        ))}
      </TopGrid>
    </SectionRoot>
  );
};

export default TopActivities;
