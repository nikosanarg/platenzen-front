'use client';

import React, { useMemo } from 'react';
import { Activity } from '@/types/activity';
import { ProcessedStats } from '@/types/stats';
import { computeLegendarySessions } from '@/lib/legendarySessions';
import { SectionTitle } from '@/components/Dashboard/styled';
import {
  Root,
  SessionsList,
  SessionRow,
  SessionName,
  SessionMeta,
  SessionReason,
  EmptyState,
} from './styled';

interface SesionesLegendariasProps {
  activities: Activity[];
  stats: ProcessedStats;
}

/**
 * Los momentos: salidas puntuales que se ganaron un lugar por algún motivo
 * concreto (distancia, ritmo, un hito). Lista compacta en la sidebar, separada
 * de "Récords" — un récord es la evolución de una marca, esto es una salida.
 */
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
        <SessionsList>
          {sessions.map((session) => (
            <SessionRow
              key={session.activity.id}
              href={session.stravaUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SessionName title={session.activity.name}>{session.activity.name}</SessionName>
              <SessionMeta>
                <span>{session.distanceKm} km · {session.pace}</span>
                <span>{session.dateLabel}</span>
              </SessionMeta>
              <SessionReason>{session.icon} {session.reason}</SessionReason>
            </SessionRow>
          ))}
        </SessionsList>
      )}
    </Root>
  );
};

export default SesionesLegendarias;
