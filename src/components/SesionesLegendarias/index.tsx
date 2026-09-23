'use client';

import React, { useMemo } from 'react';
import { Activity } from '@/types/activity';
import { ProcessedStats } from '@/types/stats';
import { computeLegendarySessions } from '@/lib/legendarySessions';
import { SectionTitle } from '@/components/Dashboard/styled';
import StatCard from '@/components/StatCard';
import { Root, SessionsList, SessionReason, EmptyState } from './styled';

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
            <StatCard
              key={session.activity.id}
              href={session.stravaUrl}
              target="_blank"
              rel="noopener noreferrer"
              hasStravaBadge
              variant="featured"
              title={<span title={session.activity.name}>{session.activity.name}</span>}
              subtitles={[
                `${session.distanceKm} km · ${session.pace}`,
                <SessionReason key="reason">{session.icon} {session.reason}</SessionReason>,
              ]}
              secondaryValue={session.dateLabel}
            />
          ))}
        </SessionsList>
      )}
    </Root>
  );
};

export default SesionesLegendarias;
