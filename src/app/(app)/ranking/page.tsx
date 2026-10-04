'use client';

import { useMemo } from 'react';
import { useStravaData } from '@/hooks/useStravaData';
import { buildHeroProfile, rankingEntryDe } from '@/lib/heroProfile';
import RankingView from '@/components/RankingView';

/** Id de la fila propia mientras no exista la API: no es un id de corredor real. */
const ID_PROPIO = 'yo';

export default function RankingPage() {
  const { activities, stats } = useStravaData();
  const ficha = useMemo(() => buildHeroProfile(activities, stats), [activities, stats]);

  return (
    <RankingView
      entries={[rankingEntryDe(ID_PROPIO, ficha)]}
      propioId={ID_PROPIO}
      fichaDe={id => (id === ID_PROPIO ? ficha : undefined)}
    />
  );
}
