import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { trigger, transition, style, animate } from '@angular/animations';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
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
export class Dashboard implements AfterViewInit {

  private energyChart?: Chart;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  summary = [
    { title: 'Total Energy Today', value: '12.4 kWh', subtitle: '+5% vs yesterday', icon: '⚡' },
    { title: 'Active Devices', value: '7', subtitle: 'Currently online', icon: '🔌' },
    { title: 'Eco Score', value: '82 / 100', subtitle: 'Good efficiency', icon: '🌱' }
  ];

  topConsumers = [
    { name: 'Smart Heater', energy: '4.2 kWh' },
    { name: 'Washing Machine', energy: '3.1 kWh' },
    { name: 'Living Room Plug', energy: '2.4 kWh' }
  ];

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.createEnergyChart();
    }
  }

  private createEnergyChart(): void {
    const canvas = document.getElementById('energyChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.energyChart?.destroy();

    this.energyChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['00','02','04','06','08','10','12','14','16','18','20','22'],
        datasets: [
          {
            data: [0.4,0.3,0.2,0.5,1.2,1.8,2.0,1.6,1.9,2.3,1.7,0.9],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.18)',
            fill: true,
            tension: 0.45,
            pointRadius: 4,
            pointBackgroundColor: '#2563eb'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,

        layout: {
          padding: { top: 8, right: 8, bottom: 8, left: 8 }
        },

        clip: { left: 10, top: 10, right: 10, bottom: 10 },

        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            ticks: {
              callback: value => value + ' kWh'
            }
          }
        }
      }
    });

    // 🔑 пересчёт размеров после layout
    setTimeout(() => this.energyChart?.resize(), 0);
  }
}
