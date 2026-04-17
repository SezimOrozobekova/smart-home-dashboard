import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { trigger, transition, style, animate } from '@angular/animations';
import { StarfieldParallaxBackgroundComponent } from '../starfield/starfield-parallax-background';
import {DashboardSummaryResponse, SummaryItem} from './service/dashboard.model';
import {DashboardService} from './service/dashboard.service';

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
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  summary: SummaryItem[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadDashboardSummary();
  }

  private loadDashboardSummary(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService.getSummary().subscribe({
      next: (response) => {
        this.summary = this.mapToSummaryItems(response);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load dashboard summary', error);
        this.errorMessage = 'Failed to load dashboard data.';
        this.isLoading = false;
      }
    });
  }

  private mapToSummaryItems(data: DashboardSummaryResponse): SummaryItem[] {
    const diff = data.costDifferenceFromLastMonth;
    const absDiff = Math.abs(diff).toFixed(2);

    return [
      {
        title: 'Devices Connected',
        value: String(data.devicesConnected),
        subtitle: 'Across all monitored rooms',
        icon: 'devices',
        type: 'default'
      },
      {
        title: 'Active Devices',
        value: String(data.activeDevices),
        subtitle: 'Currently operating',
        icon: 'power_settings_new',
        type: 'success'
      },
      {
        title: 'Rooms Monitored',
        value: String(data.roomsMonitored),
        subtitle: 'Across your smart home',
        icon: 'home_work',
        type: 'default'
      },
      {
        title: 'Estimated Monthly Cost',
        value: `$${data.estimatedMonthlyCost.toFixed(2)}`,
        subtitle:
          diff > 0
            ? `$${absDiff} higher than last month`
            : diff < 0
              ? `$${absDiff} lower than last month`
              : 'Same as last month',
        icon: 'payments',
        type: diff > 0 ? 'danger' : 'success'
      }
    ];
  }

  trackByTitle(index: number, item: SummaryItem): string {
    return item.title;
  }
}
