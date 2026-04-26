import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EnergyPoint {
  recordedAt: string;
  powerWatts: number | null;
  totalEnergyWh: number | null;
}

export interface MonthlyEnergy {
  month: string;
  consumedWh: number;
  consumedKwh: number;
  cost: number;
}

@Injectable({
  providedIn: 'root'
})
export class EnergyService {
  private readonly http = inject(HttpClient);
  private readonly api = '/api/device-energy';

  getDailyChart(deviceId: string, date: string): Observable<EnergyPoint[]> {
    return this.http.get<EnergyPoint[]>(
      `${this.api}/${deviceId}/daily-chart?date=${date}`
    );
  }

  getMonthly(deviceId: string, month: string): Observable<MonthlyEnergy> {
    return this.http.get<MonthlyEnergy>(
      `${this.api}/${deviceId}/monthly?month=${month}`
    );
  }
}
