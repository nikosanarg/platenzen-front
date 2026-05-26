export interface MonthlyRecap {
  month: string;
  totalDistance: number;
  totalActivities: number;
  totalTime: number;
  avgPace: number;
  bestPace: number;
  longestRun: number;
  activeDays: number;
  permissionsUnlockedThisMonth: string[];
}

export interface AnnualRecap {
  year: number;
  totalDistance: number;
  totalActivities: number;
  totalTime: number;
  avgWeeklyDistance: number;
  bestMonth: string;
  months: MonthlyRecap[];
  permissionsUnlockedThisYear: string[];
}
