export interface Mission {
  id: string;
  title: string;
  description: string;
  permission: string;
  permissionCode: string; // 2-letter visual badge
  targetValue: number;
  unit: string;
  higherIsBetter: boolean;
}

export interface MissionProgress {
  mission: Mission;
  currentValue: number;
  completed: boolean;
  progress: number; // 0–1
}
