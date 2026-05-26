const MARATHON_KM = 42.195;
const HALF_KM = 21.0975;

export function distanceEquivalence(km: number): string | null {
  if (km < HALF_KM) return null;

  const marathons = km / MARATHON_KM;
  if (marathons >= 1) {
    const label = marathons >= 10
      ? marathons.toFixed(0)
      : marathons.toFixed(1);
    const plural = parseFloat(label) === 1 ? 'maratón' : 'maratones';
    return `~${label} ${plural}`;
  }

  const halves = km / HALF_KM;
  if (halves >= 1) {
    const label = halves.toFixed(1);
    const plural = parseFloat(label) === 1 ? 'media' : 'medias';
    return `~${label} ${plural}`;
  }

  return null;
}
