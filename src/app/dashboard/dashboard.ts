import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  OnDestroy
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { trigger, transition, style, animate } from '@angular/animations';
import { Chart } from 'chart.js/auto';
import { StarfieldParallaxBackgroundComponent } from '../starfield/starfield-parallax-background';

interface SummaryItem {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  type?: 'default' | 'danger' | 'success';
}

interface TopConsumer {
  name: string;
  energy: string;
}

interface ActivityItem {
  time: string;
  text: string;
}

interface FilterOption {
  label: string;
  value: ChartRange;
}

type ChartRange = 'day' | 'week' | 'month';

interface EnergyChartState {
  labels: string[];
  data: number[];
  total: string;
  peakWindow: string;
}

interface TemperatureChartState {
  labels: string[];
  data: number[];
  avg: string;
  min: number;
  max: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    StarfieldParallaxBackgroundComponent
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate(
          '500ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
    ])
  ]
})
export class Dashboard implements AfterViewInit, OnDestroy {
  private energyChart?: Chart;
  private temperatureChart?: Chart;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  summary: SummaryItem[] = [
    {
      title: 'Devices Connected',
      value: '24',
      subtitle: '',
      icon: '📷',
      type: 'default'
    },
    {
      title: 'Active Devices',
      value: '12',
      subtitle: '',
      icon: '⏻',
      type: 'default'
    },
    {
      title: 'Rooms in Home',
      value: '6',
      subtitle: '',
      icon: '🏠',
      type: 'default'
    },
    {
      title: 'Energy Usage Today',
      value: '13.4',
      subtitle: '',
      icon: '⚡',
      type: 'default'
    },
    {
      title: 'Cost estimate',
      value: '$225',
      subtitle: '$35 Increased from last month',
      icon: '⚡',
      type: 'danger'
    }
  ];

  filterOptions: FilterOption[] = [
    { label: 'Today', value: 'day' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' }
  ];

  energyFilter: ChartRange = 'day';
  temperatureFilter: ChartRange = 'day';

  energyChartMock: Record<ChartRange, EnergyChartState> = {
    day: {
      labels: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'],
      data: [0.4, 0.3, 0.2, 0.5, 1.2, 1.8, 2.0, 1.6, 1.9, 2.7, 2.1, 1.0],
      total: '15.7',
      peakWindow: '17:00 – 19:00'
    },
    week: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [11.4, 12.8, 10.9, 13.2, 14.1, 16.3, 15.0],
      total: '93.7',
      peakWindow: 'Saturday 18:00 – 20:00'
    },
    month: {
      labels: [
        '1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23', '25', '27', '29'
      ],
      data: [13, 11, 15, 14, 16, 18, 17, 15, 19, 20, 18, 17, 16, 18, 21],
      total: '248.0',
      peakWindow: 'Day 29 · 18:00 – 20:00'
    }
  };

  temperatureChartMock: Record<ChartRange, TemperatureChartState> = {
    day: {
      labels: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'],
      data: [20, 19, 19, 18, 20, 22, 24, 25, 24, 23, 22, 21],
      avg: '21.4',
      min: 18,
      max: 25
    },
    week: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [21, 22, 20, 19, 23, 24, 22],
      avg: '21.6',
      min: 19,
      max: 24
    },
    month: {
      labels: [
        '1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23', '25', '27', '29'
      ],
      data: [18, 19, 20, 21, 19, 22, 23, 24, 22, 21, 20, 19, 18, 20, 21],
      avg: '20.5',
      min: 18,
      max: 24
    }
  };

  topConsumers: TopConsumer[] = [
    { name: 'Smart Heater', energy: '4.2 kWh' },
    { name: 'Washing Machine', energy: '3.1 kWh' },
    { name: 'Air Conditioner', energy: '2.8 kWh' },
    { name: 'Living Room Lights', energy: '1.6 kWh' },
    { name: 'Kitchen Oven', energy: '1.3 kWh' }
  ];

  recentActivities: ActivityItem[] = [
    { time: '19:42', text: 'Living Room Lights turned ON' },
    { time: '19:32', text: 'Front Door Opened' },
    { time: '19:05', text: 'Thermostat set to 22°C' },
    { time: '18:55', text: 'Motion detected in Garage' },
    { time: '18:21', text: 'Washing Machine cycle started' },
    { time: '17:48', text: 'Air Conditioner switched to Eco mode' },
    { time: '17:15', text: 'Kitchen Oven turned OFF' }
  ];

  get selectedEnergySummary(): EnergyChartState {
    return this.energyChartMock[this.energyFilter];
  }

  get selectedTemperatureSummary(): TemperatureChartState {
    return this.temperatureChartMock[this.temperatureFilter];
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.createEnergyChart();
      this.createTemperatureChart();
    }
  }

  ngOnDestroy(): void {
    this.energyChart?.destroy();
    this.temperatureChart?.destroy();
  }

  trackByTitle(index: number, item: SummaryItem): string {
    return item.title;
  }

  trackByConsumer(index: number, item: TopConsumer): string {
    return item.name;
  }

  trackByActivity(index: number, item: ActivityItem): string {
    return `${item.time}-${item.text}`;
  }

  onEnergyFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ChartRange;
    this.energyFilter = value;
    this.createEnergyChart();
  }

  onTemperatureFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ChartRange;
    this.temperatureFilter = value;
    this.createTemperatureChart();
  }

  private createEnergyChart(): void {
    const canvas = document.getElementById('energyChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    const chartState = this.energyChartMock[this.energyFilter];

    this.energyChart?.destroy();

    this.energyChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: chartState.labels,
        datasets: [
          {
            label: 'Energy consumed',
            data: chartState.data,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.18)',
            fill: true,
            tension: 0.42,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#22c55e',
            pointBorderColor: '#22c55e',
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 8, right: 8, bottom: 8, left: 8 }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            cornerRadius: 8,
            callbacks: {
              label: (context) => `${context.parsed.y} kWh`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#cbd5e1'
            },
            grid: {
              color: 'rgba(255,255,255,0.05)'
            },
            border: {
              display: false
            }
          },
          y: {
            ticks: {
              color: '#cbd5e1',
              callback: (value) => `${value} kWh`
            },
            grid: {
              color: 'rgba(255,255,255,0.08)'
            },
            border: {
              display: false
            }
          }
        }
      }
    });

    setTimeout(() => this.energyChart?.resize(), 0);
  }

  private createTemperatureChart(): void {
    const canvas = document.getElementById('temperatureChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    const chartState = this.temperatureChartMock[this.temperatureFilter];

    this.temperatureChart?.destroy();

    this.temperatureChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: chartState.labels,
        datasets: [
          {
            label: 'Temperature',
            data: chartState.data,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.14)',
            fill: true,
            tension: 0.42,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#38bdf8',
            pointBorderColor: '#38bdf8',
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 8, right: 8, bottom: 8, left: 8 }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            cornerRadius: 8,
            callbacks: {
              label: (context) => `${context.parsed.y} °C`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#cbd5e1'
            },
            grid: {
              color: 'rgba(255,255,255,0.05)'
            },
            border: {
              display: false
            }
          },
          y: {
            ticks: {
              color: '#cbd5e1',
              callback: (value) => `${value}°C`
            },
            grid: {
              color: 'rgba(255,255,255,0.08)'
            },
            border: {
              display: false
            }
          }
        }
      }
    });

    setTimeout(() => this.temperatureChart?.resize(), 0);
  }

  selectedFloor: 'first' | 'second' = 'first';

  floorImages: Record<'first' | 'second', string> = {
    first: 'assets/images/room1.png',
    second: 'assets/images/room1.png'
  };

  get selectedFloorImage(): string {
    return this.floorImages[this.selectedFloor];
  }

  selectFloor(floor: 'first' | 'second'): void {
    this.selectedFloor = floor;
  }
}
