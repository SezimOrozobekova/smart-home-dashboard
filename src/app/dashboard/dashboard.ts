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

interface RoomPolygon {
  id: string;
  floor: 'first' | 'second';
  name: string;
  devices: number;
  points: string;
  dotX: number;
  dotY: number;
  cardX: number;
  cardY: number;
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
      value: '8',
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
      labels: ['1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23', '25', '27', '29'],
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
      labels: ['1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23', '25', '27', '29'],
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

  selectedFloor: 'first' | 'second' = 'first';
  activeRoomId: string | null = null;

  floorImages: Record<'first' | 'second', string> = {
    first: 'assets/images/image1.jpeg',
    second: 'assets/images/room2.png'
  };

  roomPolygons: RoomPolygon[] = [
    {
      id: 'first-upper-left',
      floor: 'first',
      name: 'Office',
      devices: 2,
      points: '3,4      40.5,4      41, 51      3,51',
      dotX: 24,
      dotY: 24,
      cardX: 24,
      cardY: 40
    },
    {
      id: 'first-upper-right',
      floor: 'first',
      name: 'Living room',
      devices: 3,
      points: '43.5, 3.5    97, 3.5     97.5, 50.5        43.5, 51',
      dotX: 79,
      dotY: 24,
      cardX: 79,
      cardY: 13
    },
    {
      id: 'first-lower-left',
      floor: 'first',
      name: 'Hall',
      devices: 4,
      points: '3,55         61.5,54.5      61.5,97        3,97',
      dotX: 34,
      dotY: 75,
      cardX: 34,
      cardY: 64
    },
    {
      id: 'first-lower-right',
      floor: 'first',
      name: 'Kitchen',
      devices: 2,
      points: '64.5, 54.5      97.5,54.5      98,96.5        64.5,97',
      dotX: 83,
      dotY: 75,
      cardX: 83,
      cardY: 64
    },

    {
      id: 'second-upper-left',
      floor: 'second',
      name: 'Guest room',
      devices: 2,
      points: '2.5,3      40,3      40, 51      2.5,51',
      dotX: 21,
      dotY: 24,
      cardX: 21,
      cardY: 13
    },
    {
      id: 'second-upper-right',
      floor: 'second',
      name: 'Bedroom 1',
      devices: 3,
      points: '43.5, 3    97, 3     97.5, 50.5        43.5, 51',
      dotX: 78,
      dotY: 24,
      cardX: 78,
      cardY: 13
    },
    {
      id: 'second-lower-left',
      floor: 'second',
      name: 'Hall / Stairs',
      devices: 1,
      points: '2.5,55         61,54.5      61,98        2.5,98',
      dotX: 31,
      dotY: 74,
      cardX: 31,
      cardY: 63
    },
    {
      id: 'second-lower-right',
      floor: 'second',
      name: 'Badroom 2',
      devices: 4,
      points: '64, 54.5      97.5,54.5      98,98        64,98',
      dotX: 81,
      dotY: 74,
      cardX: 81,
      cardY: 63
    }
  ];

  get selectedEnergySummary(): EnergyChartState {
    return this.energyChartMock[this.energyFilter];
  }

  get selectedTemperatureSummary(): TemperatureChartState {
    return this.temperatureChartMock[this.temperatureFilter];
  }

  get selectedFloorImage(): string {
    return this.floorImages[this.selectedFloor];
  }

  get visibleRooms(): RoomPolygon[] {
    return this.roomPolygons.filter((room) => room.floor === this.selectedFloor);
  }

  get activeRoom(): RoomPolygon | undefined {
    return this.visibleRooms.find((room) => room.id === this.activeRoomId);
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

  trackByRoom(index: number, room: RoomPolygon): string {
    return room.id;
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

  selectFloor(floor: 'first' | 'second'): void {
    this.selectedFloor = floor;
    this.activeRoomId = null;
  }

  selectRoom(roomId: string): void {
    this.activeRoomId = this.activeRoomId === roomId ? null : roomId;
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
}
