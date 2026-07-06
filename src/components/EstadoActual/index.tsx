'use client';

import React from 'react';
import { ProcessedStats } from '@/types/stats';
import { computeMomentum } from '@/lib/momentum';
import { SectionTitle } from '@/components/Dashboard/styled';
import { EstadoRoot, CardList, ObsCard, ObsText } from './styled';

interface EstadoActualProps {
  stats: ProcessedStats;
}

interface Observation {
  id: string;
  text: React.ReactNode;
}

function formatPace(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}/km`;
}

function buildObservations(stats: ProcessedStats): Observation[] {
  const obs: Observation[] = [];

  const momentum = computeMomentum(stats.weekly);
  if (momentum) {
    const avg = Math.round(momentum.recentAvgKm * 10) / 10;
    const pct = Math.abs(Math.round(momentum.pctChange));
    if (momentum.state === 'subiendo') {
      obs.push({
        id: 'volume',
        text: (
          <>
            Promediaste <strong>{avg} km</strong> por semana en las últimas cuatro, un {pct}% más que el bloque anterior.
          </>
        ),
      });
    } else if (momentum.state === 'bajando') {
      obs.push({
        id: 'volume',
        text: (
          <>
            Promediaste <strong>{avg} km</strong> por semana en las últimas cuatro, un {pct}% por debajo del bloque anterior.
          </>
        ),
      });
    } else {
      obs.push({
        id: 'volume',
        text: (
          <>
            Promediaste <strong>{avg} km</strong> por semana en las últimas cuatro semanas.
          </>
        ),
      });
    }
  } else if (stats.weeklyAvgDistance > 0) {
    obs.push({
      id: 'volume',
      text: (
        <>
          Tu promedio semanal es de <strong>{Math.round(stats.weeklyAvgDistance * 10) / 10} km</strong>.
        </>
      ),
    });
  }

  const recentWeeks = stats.weekly.slice(-12);
  const activeWeeks = recentWeeks.filter((w) => w.count > 0).length;
  if (recentWeeks.length >= 4 && activeWeeks > 0) {
    obs.push({
      id: 'consistency',
      text: (
        <>
          Corriste en <strong>{activeWeeks} de las últimas {recentWeeks.length} semanas</strong>.
        </>
      ),
    });
  }

  if (obs.length < 3) {
    if (stats.currentStreak >= 3) {
      obs.push({
        id: 'streak',
        text: (
          <>
            Llevás <strong>{stats.currentStreak} días activos seguidos</strong>.
          </>
        ),
      });
    } else if (stats.paceEvolution.length >= 3) {
      const recent = stats.paceEvolution.slice(-3);
      const avgPace = recent.reduce((s, p) => s + p.pace, 0) / recent.length;
      obs.push({
        id: 'pace',
        text: (
          <>
            Tu ritmo promedio en las últimas salidas fue de <strong>{formatPace(Math.round(avgPace))}</strong>.
          </>
        ),
      });
    } else if (stats.hourlyDistribution.length > 0) {
      const topHour = stats.hourlyDistribution.reduce((a, b) => (a.count > b.count ? a : b));
      obs.push({
        id: 'time',
        text: (
          <>
            Tu hora de salida más frecuente es a las <strong>{topHour.label}</strong>.
          </>
        ),
      });
    }
  }

  return obs.slice(0, 3);
}

const EstadoActual: React.FC<EstadoActualProps> = ({ stats }) => {
  const observations = buildObservations(stats);
  if (observations.length === 0) return null;

  return (
    <EstadoRoot>
      <SectionTitle>Estado actual</SectionTitle>
      <CardList>
        {observations.map((obs) => (
          <ObsCard key={obs.id}>
            <ObsText>{obs.text}</ObsText>
          </ObsCard>
        ))}
      </CardList>
    </EstadoRoot>
  );
};

export default EstadoActual;
