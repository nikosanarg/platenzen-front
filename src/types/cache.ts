import { StravaActivity } from './strava';

export interface CacheData {
  activities: StravaActivity[];
  timestamp: number;
  version: number;
}
