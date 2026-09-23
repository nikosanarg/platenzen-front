import React from 'react';
import Image from 'next/image';
import { StravaRibbon } from './styled';

/**
 * Marca de esquina para toda card que enlaza a una salida real en Strava
 * (sesiones legendarias, récords): el mismo recurso visual que el cartel de
 * "última actividad" de `CoachAnalisis`, en la esquina opuesta y a su escala.
 * El contenedor que la usa necesita `position: relative; overflow: hidden;`.
 */
const StravaCornerBadge: React.FC = () => (
  <StravaRibbon>
    <Image
      src="/assets/strava-logo-only.png"
      alt=""
      width={26}
      height={26}
      style={{ width: '13px', height: '13px', objectFit: 'contain', transform: 'rotate(-45deg)' }}
    />
  </StravaRibbon>
);

export default StravaCornerBadge;
