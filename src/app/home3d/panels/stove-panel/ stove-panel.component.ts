import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stove-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stove-panel.component.html',
  styleUrl: './stove-panel.component.css'
})
export class StovePanelComponent {
  @Input() temperature = 0;

  @Output() tempChange = new EventEmitter<number>();

  change(delta: number): void {
    this.tempChange.emit(delta);
  }
}
