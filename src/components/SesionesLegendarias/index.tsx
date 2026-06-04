'use client';

import React, { useMemo } from 'react';
import { StravaActivity } from '@/types/strava';
import { ProcessedStats } from '@/types/stats';
import { computeLegendarySessions } from '@/lib/legendarySessions';
import { SectionTitle } from '@/components/Dashboard/styled';
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
  LegendaryIcon,
  StravaBtn,
  EmptyState,
} from './styled';

const RANK_ICONS = ['🥇', '🥈', '🥉', '⭐', '⭐'];

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
      <SectionTitle>Sesiones legendarias</SectionTitle>

      {sessions.length === 0 ? (
        <EmptyState>Registrá más actividades para descubrir tus sesiones legendarias.</EmptyState>
      ) : (
        <SessionsGrid>
          {sessions.map((session, idx) => (
            <SessionCard key={session.activity.id}>
              <SessionHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LegendaryIcon>{RANK_ICONS[idx]}</LegendaryIcon>
                  <SessionName>{session.activity.name}</SessionName>
                </div>
                <SessionDate>{session.dateLabel}</SessionDate>
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

              <ReasonsList>
                {session.reasons.map((reason, i) => (
                  <ReasonBadge key={i}>🏆 {reason}</ReasonBadge>
                ))}
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
