'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStravaData } from '@/hooks/useStravaData';
import TuMundo from '@/components/TuMundo';

/**
 * `useSearchParams` obliga a un borde de Suspense propio (Next lo exige para
 * no tirar toda la ruta a client-render); `useStravaData` queda afuera, en
 * `MapaPage`, para no re-montar el mapa completo mientras arranca el layout.
 */
function LugarDesdeUrl({ activities }: { activities: ReturnType<typeof useStravaData>['activities'] }) {
  const searchParams = useSearchParams();
  const lugar = searchParams.get('lugar') ?? undefined;
  return <TuMundo activities={activities} initialClusterId={lugar} />;
}

export default function MapaPage() {
  const { activities } = useStravaData();

  return (
    <Suspense fallback={null}>
      <LugarDesdeUrl activities={activities} />
    </Suspense>
  );
}
