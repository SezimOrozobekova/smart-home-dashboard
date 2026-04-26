export interface DashboardSummaryResponse {
  devicesConnected: number;
  activeDevices: number;
  roomsMonitored: number;
  consumedWh: number;
  consumedKwh: number;
  estimatedMonthlyCost: number;
  costDifferenceFromLastMonth: number;
}

export interface SummaryItem {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  type?: 'default' | 'danger' | 'success';
}
