import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lamp-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lamp-panel.component.html',
  styleUrl: './lamp-panel.component.css'
})
export class LampPanelComponent {
  @Input() status: string = 'OFF';

  @Output() toggle = new EventEmitter<void>();
  @Output() colorChange = new EventEmitter<string>();

  colors = ['#ffffff', '#ffdca8', '#60a5fa', '#22c55e', '#a855f7'];

  onToggle() {
    this.toggle.emit();
  }

  selectColor(color: string) {
    this.colorChange.emit(color);
  }
}
