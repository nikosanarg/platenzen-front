export function mpsToSecPerKm(mps: number): number {
  if (mps <= 0) return 0;
  return 1000 / mps;
}

export function secPerKmToString(secPerKm: number): string {
  if (secPerKm <= 0) return '--';
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')} /km`;
}

export function getPaceFromActivity(averageSpeed: number): number {
  return mpsToSecPerKm(averageSpeed);
}
