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
import { ActivatedRoute, Router } from '@angular/router';
import { Chart } from 'chart.js/auto';
import {
  EnergyPoint,
  EnergyService,
  MonthlyEnergy
} from '../core/services/energy.service';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics.html',
  styleUrl: './statistics.css'
})
export class Statistics implements OnInit, AfterViewInit, OnDestroy {
  private readonly energyService = inject(EnergyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private intervalId: any;

  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;

  deviceId = '';
  today = this.getTodayLocal();

  monthly: MonthlyEnergy | null = null;
  dailyPoints: EnergyPoint[] = [];

  monthlyLoading = false;
  chartLoading = false;
  error = '';

  private viewReady = false;

  ngOnInit(): void {
    this.deviceId = this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.deviceId) {
      this.error = 'Device id is missing';
      return;
    }

    this.loadMonthly();
    this.loadDaily();

    this.intervalId = setInterval(() => {
      this.loadDaily();
    }, 15000);
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryRenderChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  goBack(): void {
    this.router.navigate(['/devices']);
  }

  private getTodayLocal(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  loadMonthly(): void {
    const month = this.today.slice(0, 7);
    this.monthlyLoading = true;
    this.error = '';

    this.energyService.getMonthly(this.deviceId, month).subscribe({
      next: (res) => {
        this.monthly = res;
        this.monthlyLoading = false;
      },
      error: (err) => {
        console.error('Monthly energy error:', err);
        this.monthly = null;
        this.monthlyLoading = false;
        this.error = 'Failed to load monthly statistics';
      }
    });
  }

  loadDaily(): void {
    this.chartLoading = true;
    this.error = '';

    this.energyService.getDailyChart(this.deviceId, this.today).subscribe({
      next: (data) => {
        this.dailyPoints = (data ?? []).sort(
          (a, b) =>
            new Date(a.recordedAt).getTime() -
            new Date(b.recordedAt).getTime()
        );

        this.chartLoading = false;
        this.tryRenderChart();
      },
      error: (err) => {
        console.error('Daily energy chart error:', err);
        this.dailyPoints = [];
        this.chartLoading = false;
        this.error = 'Failed to load daily chart';
      }
    });
  }

  tryRenderChart(): void {
    if (!this.viewReady || !this.chartCanvas || !this.dailyPoints.length) {
      return;
    }

    const labels = this.dailyPoints.map((point) =>
      new Date(point.recordedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    );

    const values = this.dailyPoints.map((point) => point.powerWatts ?? 0);

    this.chart?.destroy();

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Power (W)',
            data: values,
            tension: 0.4,
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
              label: (context) => `Power: ${context.parsed.y} W`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Watts'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Time'
            }
          }
        }
      }
    });
  }

  getCost(): number {
    if (!this.monthly) {
      return 0;
    }

    const tariff = 2.16;
    return this.monthly.consumedKwh * tariff;
  }
}
