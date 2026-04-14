import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { trigger, transition, style, animate } from '@angular/animations';
import { StarfieldParallaxBackgroundComponent } from '../starfield/starfield-parallax-background';

interface SummaryItem {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  type?: 'default' | 'danger' | 'success';
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
export class Dashboard {
  summary: SummaryItem[] = [
    {
      title: 'Devices Connected',
      value: '24',
      subtitle: 'Across all monitored rooms',
      icon: 'devices',
      type: 'default'
    },
    {
      title: 'Active Devices',
      value: '12',
      subtitle: 'Currently operating',
      icon: 'power_settings_new',
      type: 'success'
    },
    {
      title: 'Rooms Monitored',
      value: '8',
      subtitle: 'Across two floors',
      icon: 'home_work',
      type: 'default'
    },
    {
      title: 'Estimated Monthly Cost',
      value: '$225',
      subtitle: '$35 higher than last month',
      icon: 'payments',
      type: 'danger'
    }
  ];

  trackByTitle(index: number, item: SummaryItem): string {
    return item.title;
  }
}
