import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kettle-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kettle-panel.component.html',
  styleUrl: './kettle-panel.component.css'
})
export class KettlePanelComponent {
  @Input() timeLeft = 0;

  get progressWidth(): number {
    return (this.timeLeft / 120) * 100;
  }
}
