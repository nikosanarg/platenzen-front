'use client';

import { useStravaData } from '@/hooks/useStravaData';
import PersonajeCard from '@/components/PersonajeCard';
import CoachAnalisis from '@/components/CoachAnalisis';
import RecordHistorySection from '@/components/RecordHistorySection';
import SesionesLegendarias from '@/components/SesionesLegendarias';
import LugaresFrecuentados from '@/components/LugaresFrecuentados';
import InsightsSection from '@/components/InsightsSection';
import PatronesCharts from '@/components/charts/PatronesCharts';
import { HistoriaLayout, HistoriaMain, HistoriaSidebar, HistoriaFooter } from '@/components/Dashboard/styled';

/**
 * La Home responde tres preguntas: qué hice, cómo estoy, cómo viene mi
 * historia (ver `project-profile.md`). "Cómo estoy" hoy no tiene bloque
 * propio — vive repartido en el registro de referencia del hero y en el
 * impacto de la última salida dentro del coach.
 *
 * Todo el contenido —hero, coach, patrones— comparte una sola sidebar de
 * lectura rápida (récords, lugares, sesiones legendarias), fija al costado
 * desde arriba. El mapa grande de "Tu Mundo" no vive suelto en la página: es
 * lo que se ve al tocar un lugar de la sidebar (ver `LugaresFrecuentados`).
 * En el teléfono la sidebar baja al final, en el orden en que aparece acá
 * (ver `HistoriaLayout`), y "Lo que dicen tus datos" —tercer item del grid,
 * no de `HistoriaMain`— queda debajo de todo eso.
 */
export default function ProgresoPage() {
  const { activities, stats } = useStravaData();

  return (
    <HistoriaLayout>
      <HistoriaMain>
        {/* ── Quién sos: el récord de referencia, el perfil de ramas y la constancia ── */}
        <PersonajeCard activities={activities} stats={stats} />

        {/* ── ¿Qué hice?: la última salida, su impacto y el historial ── */}
        <CoachAnalisis activities={activities} stats={stats} />

        {/* ── Cómo, cuándo y cuánto entrenás: patrones y tendencias ── */}
        <PatronesCharts stats={stats} />
      </HistoriaMain>

      <HistoriaSidebar>
        <RecordHistorySection activities={activities} />
        <LugaresFrecuentados activities={activities} />
        <SesionesLegendarias activities={activities} stats={stats} />
      </HistoriaSidebar>

      {/*
        Item propio del grid, no de HistoriaMain: en el teléfono el orden del
        DOM es el orden visual, y viene después de la sidebar a propósito.
      */}
      <HistoriaFooter>
        <InsightsSection activities={activities} stats={stats} />
      </HistoriaFooter>
    </HistoriaLayout>
  );
}
