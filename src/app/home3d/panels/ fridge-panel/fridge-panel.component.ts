import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fridge-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fridge-panel.component.html',
  styleUrl: './fridge-panel.component.css'
})
export class FridgePanelComponent {
  @Input() temperature = 0;

  @Output() tempChange = new EventEmitter<number>();

  change(delta: number): void {
    this.tempChange.emit(delta);
  }
}
