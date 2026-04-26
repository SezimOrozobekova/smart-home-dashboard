import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import {
  EnergyChartPoint,
  EnergyPeriod,
  EnergyService,
  MonthlyEnergy
} from '../../../core/services/energy.service';

@Component({
  selector: 'app-statistics-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './statistics-page.html',
  styleUrl: './statistics-page.css'
})
export class StatisticsPage implements OnInit, AfterViewInit, OnDestroy {
  private energyService = inject(EnergyService);

  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;

  today = this.getTodayLocal();

  selectedPeriod: EnergyPeriod = 'DAY';
  selectedDate = this.today;

  monthly: MonthlyEnergy | null = null;
  chartPoints: EnergyChartPoint[] = [];

  monthlyLoading = false;
  chartLoading = false;
  errorMessage = '';

  private viewReady = false;

  ngOnInit(): void {
    this.loadMonthly();
    this.loadChart();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryRenderChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  selectPeriod(period: EnergyPeriod): void {
    this.selectedPeriod = period;
    this.loadChart();
  }

  onDateChange(): void {
    this.loadMonthly();
    this.loadChart();
  }

  loadMonthly(): void {
    const month = this.selectedDate.slice(0, 7);

    this.monthlyLoading = true;
    this.errorMessage = '';

    this.energyService.getMyMonthly(month).subscribe({
      next: (res) => {
        this.monthly = res;
        this.monthlyLoading = false;
      },
      error: (err) => {
        console.error('monthly error', err);
        this.monthly = null;
        this.monthlyLoading = false;
        this.errorMessage = 'Failed to load monthly data';
      }
    });
  }

  loadChart(): void {
    this.chartLoading = true;
    this.errorMessage = '';

    this.energyService
      .getMyEnergyChart(this.selectedPeriod, this.selectedDate)
      .subscribe({
        next: (data) => {
          this.chartPoints = data ?? [];
          this.chartLoading = false;
          this.tryRenderChart();
        },
        error: (err) => {
          console.error('chart error', err);
          this.chartPoints = [];
          this.chartLoading = false;
          this.errorMessage = 'Failed to load chart data';
          this.destroyChart();
        }
      });
  }

  tryRenderChart(): void {
    if (!this.viewReady || !this.chartCanvas) {
      return;
    }

    if (!this.chartPoints.length) {
      this.destroyChart();
      return;
    }

    const labels = this.chartPoints.map((point) => point.label);
    const values = this.chartPoints.map((point) => point.consumedKwh ?? 0);

    this.destroyChart();

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Energy Consumption (kWh)',
            data: values,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const point = this.chartPoints[context.dataIndex];

                return [
                  `Energy: ${point.consumedKwh.toFixed(3)} kWh`,
                  `Cost: ${point.cost.toFixed(2)} сом`
                ];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'kWh'
            }
          },
          x: {
            title: {
              display: true,
              text: this.selectedPeriod === 'DAY' ? 'Hour' : 'Date'
            }
          }
        }
      }
    });
  }

  getPeriodTitle(): string {
    switch (this.selectedPeriod) {
      case 'DAY':
        return 'Daily energy consumption by hour';
      case 'WEEK':
        return 'Weekly energy consumption by day';
      case 'MONTH':
        return 'Monthly energy consumption by day';
    }
  }

  getTotalKwh(): number {
    return this.chartPoints.reduce(
      (sum, point) => sum + (point.consumedKwh ?? 0),
      0
    );
  }

  getTotalCost(): number {
    return this.chartPoints.reduce(
      (sum, point) => sum + (point.cost ?? 0),
      0
    );
  }

  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private getTodayLocal(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }
}
