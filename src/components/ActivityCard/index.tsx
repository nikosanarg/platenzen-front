import React from 'react';
import { StravaActivity } from '@/types/strava';
import { formatDistance, secondsToHMS, formatElevation } from '@/utils/units';
import { secPerKmToString, mpsToSecPerKm } from '@/utils/pace';
import {
  CardRoot,
  ActivityBadge,
  ActivityName,
  ActivityDate,
  ActivityStats,
  ActivityStat,
  ActivityStatLabel,
  ActivityStatValue,
} from './styled';

interface ActivityCardProps {
  activity: StravaActivity;
  highlight?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, highlight }) => {
  const sport = activity.sport_type || activity.type;
  const isRunning = ['Run', 'TrailRun', 'VirtualRun'].includes(sport);

  return (
    <CardRoot>
      <ActivityBadge $sport={sport}>{sport}</ActivityBadge>
      <ActivityName>{activity.name}</ActivityName>
      <ActivityDate>{formatDate(activity.start_date_local)}</ActivityDate>
      <ActivityStats>
        <ActivityStat>
          <ActivityStatLabel>Distancia</ActivityStatLabel>
          <ActivityStatValue>{formatDistance(activity.distance)}</ActivityStatValue>
        </ActivityStat>
        <ActivityStat>
          <ActivityStatLabel>Tiempo</ActivityStatLabel>
          <ActivityStatValue>{secondsToHMS(activity.moving_time)}</ActivityStatValue>
        </ActivityStat>
        {isRunning && activity.average_speed > 0 && (
          <ActivityStat>
            <ActivityStatLabel>Ritmo</ActivityStatLabel>
            <ActivityStatValue>{secPerKmToString(mpsToSecPerKm(activity.average_speed))}</ActivityStatValue>
          </ActivityStat>
        )}
        {activity.total_elevation_gain > 0 && (
          <ActivityStat>
            <ActivityStatLabel>Desnivel</ActivityStatLabel>
            <ActivityStatValue>{formatElevation(activity.total_elevation_gain)}</ActivityStatValue>
          </ActivityStat>
        )}
      </ActivityStats>
      {highlight && (
        <ActivityBadge $sport="highlight" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
          {highlight}
        </ActivityBadge>
      )}
    </CardRoot>
  );
};

export default ActivityCard;
