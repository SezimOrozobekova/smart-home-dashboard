import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EnergyPoint {
  recordedAt: string;
  powerWatts: number;
  totalEnergyWh: number;
}

export interface MonthlyEnergy {
  month: string;
  firstTotalWh: number;
  lastTotalWh: number;
  consumedWh: number;
  consumedKwh: number;
}

@Injectable({
  providedIn: 'root'
})
export class EnergyService {
  private http = inject(HttpClient);
  private api = '/api/device-energy';

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
