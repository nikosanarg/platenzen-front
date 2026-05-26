export interface MonthlyStats {
  month: string;
  label: string;
  distance: number;
  count: number;
  time: number;
}

export interface WeeklyStats {
  week: string;
  label: string;
  distance: number;
  count: number;
}

export interface DayStats {
  date: string;
  count: number;
  distance: number;
}

export interface PacePoint {
  date: string;
  pace: number;
  label: string;
}

export interface SportCount {
  sport: string;
  count: number;
  distance: number;
}

export interface HourCount {
  hour: number;
  label: string;
  count: number;
}

export interface WeekdayCount {
  day: number;
  label: string;
  count: number;
}

export interface CumulativePoint {
  date: string;
  cumulative: number;
}

export interface ProcessedStats {
  totalDistance: number;
  totalTime: number;
  totalActivities: number;
  weeklyAvgDistance: number;
  avgPace: number;
  bestPace: number;
  longestActivity: number;
  currentStreak: number;
  longestStreak: number;
  monthly: MonthlyStats[];
  weekly: WeeklyStats[];
  daily: DayStats[];
  paceEvolution: PacePoint[];
  sportDistribution: SportCount[];
  hourlyDistribution: HourCount[];
  weekdayDistribution: WeekdayCount[];
  cumulativeDistance: CumulativePoint[];
}
