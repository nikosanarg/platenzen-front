import { StravaActivity } from '@/types/strava';

const BASE_URL = 'https://www.strava.com/api/v3';
const PER_PAGE = 200;

export class StravaError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'StravaError';
  }
}

async function fetchPage(
  token: string,
  page: number
): Promise<StravaActivity[]> {
  const url = `${BASE_URL}/athlete/activities?per_page=${PER_PAGE}&page=${page}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new StravaError(401, 'Token inválido o expirado. Ingresá un nuevo token.');
    }
    throw new StravaError(res.status, `Error al conectar con Strava (${res.status})`);
  }

  return res.json() as Promise<StravaActivity[]>;
}

export async function fetchAllActivities(
  token: string,
  onProgress?: (count: number) => void
): Promise<StravaActivity[]> {
  const all: StravaActivity[] = [];
  let page = 1;

  while (true) {
    const batch = await fetchPage(token, page);
    if (batch.length === 0) break;
    all.push(...batch);
    onProgress?.(all.length);
    if (batch.length < PER_PAGE) break;
    page++;
  }

  return all;
}
