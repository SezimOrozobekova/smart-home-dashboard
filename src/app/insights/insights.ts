import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule
  ],
  templateUrl: './insights.html',
  styleUrl: './insights.css'
})
export class Insights {

  insights = [
    {
      title: 'High evening energy consumption',
      description: 'Energy usage peaks between 17:00 and 19:00, mainly caused by heating and household appliances.',
      level: 'warning',
      recommendation: 'Consider shifting appliance usage to off-peak hours.'
    },
    {
      title: 'Standby power detected',
      description: 'Some devices consume energy even when not actively used.',
      level: 'info',
      recommendation: 'Disconnect idle devices or use smart plugs.'
    },
    {
      title: 'Good overall energy efficiency',
      description: 'Your current energy usage is within an efficient range compared to average households.',
      level: 'success',
      recommendation: 'Maintain current consumption patterns.'
    }
  ];
}
