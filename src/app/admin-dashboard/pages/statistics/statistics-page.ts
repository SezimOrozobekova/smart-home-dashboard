import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';
import {
  EnergyPoint,
  EnergyService,
  MonthlyEnergy
} from '../../../core/services/energy.service';

@Component({
  selector: 'app-statistics-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics-page.html',
  styleUrl: './statistics-page.css'
})
export class StatisticsPage implements OnInit, AfterViewInit {
  private energyService = inject(EnergyService);

  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;

  deviceId = 'e74f1721-34ce-4221-a9fc-656ac4707116';
  today = new Date().toISOString().slice(0, 10);

  monthly: MonthlyEnergy | null = null;
  dailyPoints: EnergyPoint[] = [];

  monthlyLoading = false;
  chartLoading = false;

  private viewReady = false;

  ngOnInit(): void {
    this.loadMonthly();
    this.loadDaily();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryRenderChart();
  }

  loadMonthly(): void {
    const month = this.today.slice(0, 7);
    this.monthlyLoading = true;

    this.energyService.getMonthly(this.deviceId, month).subscribe({
      next: (res) => {
        console.log('monthly response', res);
        this.monthly = res;
        this.monthlyLoading = false;
      },
      error: (err) => {
        console.error('monthly error', err);
        this.monthly = null;
        this.monthlyLoading = false;
      }
    });
  }

  loadDaily(): void {
    this.chartLoading = true;

    this.energyService.getDailyChart(this.deviceId, this.today).subscribe({
      next: (data) => {
        console.log('daily response', data);
        this.dailyPoints = data;
        this.chartLoading = false;
        this.tryRenderChart();
      },
      error: (err) => {
        console.error('daily error', err);
        this.dailyPoints = [];
        this.chartLoading = false;
      }
    });
  }

  tryRenderChart(): void {
    if (!this.viewReady) return;
    if (!this.chartCanvas) return;
    if (!this.dailyPoints.length) return;

    const labels = this.dailyPoints.map((d) =>
      new Date(d.recordedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    );

    const values = this.dailyPoints.map((d) => d.powerWatts ?? 0);

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Power (W)',
            data: values,
            tension: 0.35,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  getCost(): number {
    if (!this.monthly) return 0;

    const tariff = 2.16;
    return this.monthly.consumedKwh * tariff;
  }
}
