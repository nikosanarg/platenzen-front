import { Activity } from './activity';

export interface CacheData {
  activities: Activity[];
  timestamp: number;
  version: number;
}
