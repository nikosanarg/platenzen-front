import { StravaActivity } from '@/types/strava';
import { Activity } from '@/types/activity';

/**
 * Strava es el proveedor que el dominio ya hablaba: el contrato canónico
 * (`Activity`) se modeló sobre su vocabulario, así que acá no hay nada que
 * traducir más que la identidad (`provider` + `externalId`).
 */
export function toActivity(raw: StravaActivity): Activity {
  return {
    ...raw,
    provider: 'strava',
    externalId: String(raw.id),
  };
}
