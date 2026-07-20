'use client';

import React, { useMemo } from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeLegendarySessions } from '@/lib/legendarySessions';
import {
  Root,
  SessionsGrid,
  SessionCard,
  SessionHeader,
  SessionName,
  SessionDate,
  SessionStats,
  SessionStat,
  SessionStatValue,
  SessionStatLabel,
  ReasonsList,
  ReasonBadge,
  StravaBtn,
  EmptyState,
} from './styled';

interface SesionesLegendariasProps {
  activities: StravaActivity[];
  stats: ProcessedStats;
}

const SesionesLegendarias: React.FC<SesionesLegendariasProps> = ({ activities, stats }) => {
  const sessions = useMemo(
    () => computeLegendarySessions(activities, stats),
    [activities, stats]
  );

  return (
    <Root>
      {sessions.length === 0 ? (
        <EmptyState>Registrá más actividades para descubrir tus sesiones legendarias.</EmptyState>
      ) : (
        <SessionsGrid>
          {sessions.map((session) => (
            <SessionCard key={session.activity.id}>
              <SessionHeader>
                <SessionName>{session.activity.name}</SessionName>
              </SessionHeader>

              <SessionStats>
                <SessionStat>
                  <SessionStatValue>{session.distanceKm} km</SessionStatValue>
                  <SessionStatLabel>Distancia</SessionStatLabel>
                </SessionStat>
                <SessionStat>
                  <SessionStatValue>{session.pace}</SessionStatValue>
                  <SessionStatLabel>Ritmo</SessionStatLabel>
                </SessionStat>
              </SessionStats>

              <SessionDate>{session.dateLabel}</SessionDate>

              <ReasonsList>
                <ReasonBadge>{session.icon} {session.reason}</ReasonBadge>
              </ReasonsList>

              <StravaBtn href={session.stravaUrl} target="_blank" rel="noopener noreferrer">
                Ver en Strava ↗
              </StravaBtn>
            </SessionCard>
          ))}
        </SessionsGrid>
      )}
    </Root>
  );
};

export default SesionesLegendarias;
