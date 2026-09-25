'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from '@/types/activity';
import { useLugares, Lugar } from '@/hooks/useLugares';
import { formatPaceStr } from '@/lib/worldMap';
import { SectionTitle } from '@/components/Dashboard/styled';
import StatCard from '@/components/StatCard';
import { Root, PlaceList, PlaceRank, PlaceVisits, PlaceKm, MoreRow, MoreLink } from './styled';

interface LugaresFrecuentadosProps {
  activities: Activity[];
}

/** Un vistazo, no el ranking completo: para eso está la tab "Mapa". */
const TOP = 3;

/** La salida más larga del lugar, para el segundo renglón de la fila. */
function salidaMasLarga(lugar: Lugar) {
  return lugar.activities.reduce(
    (max, a) => (a.distanceKm > max.distanceKm ? a : max),
    lugar.activities[0],
  );
}

/**
 * La tercera lista de la sidebar: dónde corrés, no sólo cuánto ni cuándo. Es
 * el mismo agrupado de zonas que dibuja "Tu Mundo" (`useLugares`), leído
 * como ranking en vez de como mapa — con el mismo nombre para cada lugar en
 * las dos pantallas.
 *
 * Tocar un lugar lleva a la tab "Mapa" ya centrada y seleccionada ahí: el
 * mapa completo, con panel de detalle, zoom y arrastre libres, en vez de un
 * mapa chico embebido en un modal.
 */
const LugaresFrecuentados: React.FC<LugaresFrecuentadosProps> = ({ activities }) => {
  const router = useRouter();
  const lugares = useLugares(activities);
  const top = lugares.slice(0, TOP);

  if (top.length === 0) return null;

  return (
    <Root>
      <SectionTitle>Lugares más frecuentados</SectionTitle>
      <PlaceList>
        {top.map((lugar, idx) => {
          const larga = salidaMasLarga(lugar);
          return (
            <StatCard
              key={lugar.id}
              onClick={() => router.push(`/mapa?lugar=${encodeURIComponent(lugar.id)}`)}
              leftVisual={<PlaceRank>#{idx + 1}</PlaceRank>}
              title={lugar.nombre}
              subtitles={[
                `${formatPaceStr(lugar.bestPaceSecPerKm)} · ${lugar.lastVisit}`,
                `${larga.distanceKm.toFixed(1)} km · ${larga.date}`,
              ]}
              primaryValue={<PlaceVisits>{lugar.visitCount}×</PlaceVisits>}
              secondaryValue={<PlaceKm>{lugar.distanceKm} km</PlaceKm>}
            />
          );
        })}
      </PlaceList>

      <MoreRow>
        <MoreLink href="/mapa">Ver más en el mapa ↗</MoreLink>
      </MoreRow>
    </Root>
  );
};

export default LugaresFrecuentados;
