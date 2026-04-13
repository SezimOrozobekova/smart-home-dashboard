import {Component, inject} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Header
  ],
  templateUrl: './app.html'
})
export class App {
  private readonly authService = inject(AuthService);
  protected shouldShowHeader(): boolean {
    return this.authService.isAuthenticated() && this.authService.isAdmin() || this.authService.isUser();
  }
}
