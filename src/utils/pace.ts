export function mpsToSecPerKm(mps: number): number {
  if (mps <= 0) return 0;
  return 1000 / mps;
}

/**
 * Parte un ritmo en minutos y segundos para mostrarlo.
 *
 * Redondea el total antes de partirlo. Redondear los segundos por separado
 * produce "4:60" para 299.6 s/km, porque `Math.round(59.6)` da 60 y se imprime
 * tal cual. Los ritmos salen de `1000 / average_speed`, así que ese caso es
 * alcanzable con datos reales.
 *
 * Es la única definición de la regla: los formateadores de cada módulo la usan
 * y sólo agregan su propio separador y su texto de "sin dato".
 */
export function splitPace(secPerKm: number): { minutes: number; seconds: string } {
  const total = Math.round(secPerKm);
  return {
    minutes: Math.floor(total / 60),
    seconds: (total % 60).toString().padStart(2, '0'),
  };
}

export function secPerKmToString(secPerKm: number): string {
  if (secPerKm <= 0) return '--';
  const { minutes, seconds } = splitPace(secPerKm);
  return `${minutes}:${seconds} /km`;
}

export function getPaceFromActivity(averageSpeed: number): number {
  return mpsToSecPerKm(averageSpeed);
}
