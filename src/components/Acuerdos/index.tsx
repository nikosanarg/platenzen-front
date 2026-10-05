'use client';

import React from 'react';
import styled from 'styled-components';
import { Panel } from '@/components/Panel';
import { SectionTitle } from '@/components/Dashboard/styled';
import { ACUERDOS_VERSION } from '@/lib/club/acuerdos';

const Root = styled(Panel)`
  padding: 1.75rem 1.5rem;
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;

  h3 {
    margin: 1.4rem 0 0.4rem;
    font-size: 0.95rem;
    color: var(--text-primary);
  }

  ul {
    padding-left: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  @media (max-width: 600px) {
    padding: 1.25rem 1rem;
  }
`;

const Version = styled.p`
  font-size: 0.78rem;
  color: var(--text-muted);
`;

/**
 * El texto que se acepta al sumarse al club. Si cambia de fondo, se sube
 * `ACUERDOS_VERSION` acá y en platenzen-api: cada corredor la acepta de nuevo
 * y, mientras tanto, sus números no se actualizan.
 */
const Acuerdos: React.FC = () => (
  <Root as="article">
    <SectionTitle as="h1">Acuerdos del club</SectionTitle>
    <Version>Versión {ACUERDOS_VERSION}</Version>

    <h3>Qué es el club</h3>
    <p>
      Platenzen funciona sin el club: tu historial de Strava se procesa y se guarda en tu
      dispositivo. El club es opcional y suma un ranking y una ficha que otros pueden ver.
    </p>

    <h3>Qué se publica</h3>
    <ul>
      <li>El nombre que elijas, o un nombre al azar si no elegís ninguno. Tu país, si lo elegís.</li>
      <li>Tu ficha: título, mejor marca, radar, totales, racha y frases sobre tus datos.</li>
      <li>Kilómetros, salidas y ritmo de running por día, de los últimos 90 días.</li>
      <li>Qué semanas tuviste actividad, para calcular tu racha y tu liga.</li>
    </ul>

    <h3>Qué no se publica ni se guarda</h3>
    <ul>
      <li>Tus actividades una por una, sus recorridos, mapas o el nombre que les pusiste.</li>
      <li>Tus datos de cuenta de Strava: ni tu nombre, ni tu foto, ni tu ciudad, ni tu id.</li>
    </ul>
    <p>
      Para reconocerte usamos un código derivado de tu cuenta de Strava, del que no se puede
      volver a ella.
    </p>

    <h3>Quién lo ve</h3>
    <p>
      El ranking es público. Elegís tu nivel de privacidad y lo podés cambiar cuando quieras:
      pública (ranking y ficha), sólo en el ranking, u oculta.
    </p>

    <h3>Tus números los calcula tu dispositivo</h3>
    <p>
      Lo que se publica sale de tu historial, procesado en tu teléfono o tu computadora. Publicar
      números alterados para subir en el ranking va contra el sentido del club: podemos sacar del
      ranking a quien lo haga.
    </p>

    <h3>Tu nombre</h3>
    <p>
      No puede hacerse pasar por otra persona ni ser ofensivo. Si lo es, podemos reemplazarlo por
      tu nombre al azar.
    </p>

    <h3>Cómo salir</h3>
    <p>
      Desde tu perfil, «Dejar el club» borra tu perfil y todo lo publicado. Tus estadísticas en el
      dispositivo no se tocan.
    </p>

    <h3>Sin garantías</h3>
    <p>
      El ranking es un juego entre corredores. Los números dependen de lo que registra Strava y
      pueden tener errores; no son una medición oficial de nada.
    </p>

    <h3>Cambios</h3>
    <p>
      Si estos acuerdos cambian, te lo vamos a pedir de nuevo. Hasta que aceptes la versión nueva,
      tus números no se actualizan.
    </p>
  </Root>
);

export default Acuerdos;
