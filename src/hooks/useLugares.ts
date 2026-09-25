'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity } from '@/types/activity';
import { computeWorldMap, clusterZones, ZoneCluster } from '@/lib/worldMap';
import { getPlaceName } from '@/services/geocoding/nominatim';

export interface Lugar extends ZoneCluster {
  /** Nombre real (Nominatim) si se pudo resolver; si no, "Lugar #n" por ranking de visitas. */
  nombre: string;
}

/**
 * Los lugares donde corrés, con nombre. Un solo cálculo (`computeWorldMap` +
 * `clusterZones`) compartido por la sidebar de Progreso y la tab Mapa, para
 * que un mismo lugar se llame igual en las dos pantallas.
 *
 * Los nombres se resuelven en segundo plano, uno a la vez (`getPlaceName`
 * ya hace de cola): el ranking se ve de entrada con el fallback numerado y
 * cada fila se actualiza sola apenas llega su nombre.
 */
export function useLugares(activities: Activity[]): Lugar[] {
  const clusters = useMemo(() => {
    const data = computeWorldMap(activities);
    return data ? clusterZones(data.zones) : [];
  }, [activities]);

  const [nombres, setNombres] = useState<Record<string, string>>({});
  // Qué lugares ya dispararon su pedido de nombre, sobrevive a que el efecto
  // vuelva a correr (por ej. tras un refresh de actividades) — sin esto, un
  // lugar que ya tiene nombre real volvería a pedirlo de cero cada vez.
  const pedidos = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelado = false;
    const nuevos = clusters.filter(c => !pedidos.current.has(c.id));
    if (nuevos.length === 0) return;
    nuevos.forEach(c => pedidos.current.add(c.id));

    // Placeholder vacío para los recién pedidos: marca "en curso" de una
    // sola vez, así el ranking no espera al primer nombre resuelto para
    // pintarse.
    setNombres(prev => {
      const actualizado = { ...prev };
      for (const c of nuevos) actualizado[c.id] = '';
      return actualizado;
    });

    nuevos.forEach(cluster => {
      getPlaceName(cluster.lat, cluster.lon).then(nombre => {
        if (cancelado) return;
        setNombres(actual => ({ ...actual, [cluster.id]: nombre ?? '' }));
      });
    });

    return () => {
      cancelado = true;
    };
  }, [clusters]);

  return useMemo(
    () => clusters.map((cluster, i) => ({ ...cluster, nombre: nombres[cluster.id] || `Lugar #${i + 1}` })),
    [clusters, nombres]
  );
}
