'use client';

import React, { useMemo, useState } from 'react';
import { Activity } from '@/types/activity';
import { computeWorldMap, clusterZones, formatPaceStr, ZoneCluster } from '@/lib/worldMap';
import { SectionTitle } from '@/components/Dashboard/styled';
import { Modal } from 'kaizen-lib/ui';
import TuMundo from '@/components/TuMundo';
import StatCard from '@/components/StatCard';
import { Root, PlaceList, PlaceRank, PlaceVisits, MoreRow, MoreLink } from './styled';

interface LugaresFrecuentadosProps {
  activities: Activity[];
}

/** Un vistazo, no el ranking completo: para eso está la tab "Mapa". */
const TOP = 3;

/** La salida más larga del lugar, para el segundo renglón de la fila. */
function salidaMasLarga(cluster: ZoneCluster) {
  return cluster.activities.reduce(
    (max, a) => (a.distanceKm > max.distanceKm ? a : max),
    cluster.activities[0],
  );
}

/**
 * La tercera lista de la sidebar: dónde corrés, no sólo cuánto ni cuándo. Es
 * el mismo agrupado de zonas que dibuja "Tu Mundo" (`clusterZones`), leído
 * como ranking en vez de como mapa.
 *
 * Tocar un lugar abre el mapa grande en un modal, centrado y seleccionado en
 * ese lugar — una consulta rápida. "Ver más" lleva a la tab "Mapa", con el
 * mapa completo: todas las zonas, con zoom y arrastre libres.
 */
const LugaresFrecuentados: React.FC<LugaresFrecuentadosProps> = ({ activities }) => {
  const todos = useMemo(() => {
    const data = computeWorldMap(activities);
    return data ? clusterZones(data.zones) : [];
  }, [activities]);

  const clusters = todos.slice(0, TOP);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  if (clusters.length === 0) return null;

  return (
    <Root>
      <SectionTitle>Lugares más frecuentados</SectionTitle>
      <PlaceList>
        {clusters.map((cluster, idx) => {
          const larga = salidaMasLarga(cluster);
          return (
            <StatCard
              key={cluster.id}
              onClick={() => setSeleccionado(cluster.id)}
              leftVisual={<PlaceRank>#{idx + 1}</PlaceRank>}
              title={`${cluster.distanceKm} km acumulados`}
              subtitles={[
                `${formatPaceStr(cluster.bestPaceSecPerKm)} · ${cluster.lastVisit}`,
                `${larga.distanceKm.toFixed(1)} km · ${larga.date}`,
              ]}
              primaryValue={<PlaceVisits>{cluster.visitCount}×</PlaceVisits>}
            />
          );
        })}
      </PlaceList>

      {todos.length > TOP && (
        <MoreRow>
          <MoreLink href="/mapa">Ver más en el mapa ↗</MoreLink>
        </MoreRow>
      )}

      <Modal
        open={seleccionado !== null}
        onClose={() => setSeleccionado(null)}
        title="Tu Mundo"
        maxWidth="760px"
      >
        {seleccionado && (
          <TuMundo activities={activities} initialClusterId={seleccionado} showHeading={false} />
        )}
      </Modal>
    </Root>
  );
};

export default LugaresFrecuentados;
