export function metersToKm(m: number): number {
  return m / 1000;
}

export function kmToString(km: number, decimals = 1): string {
  return `${km.toFixed(decimals)} km`;
}

export function secondsToHMS(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m ${sec.toString().padStart(2, '0')}s`;
}

export function secondsToHours(s: number): number {
  return s / 3600;
}

export function formatDistance(meters: number): string {
  return kmToString(metersToKm(meters));
}

export function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`;
}
