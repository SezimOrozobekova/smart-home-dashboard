import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const { name, email, password } = this.form.getRawValue();

    this.authService.register({ name, email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Registration successful. Redirecting to login...');

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 800);
      },
      error: (err) => {
        this.loading.set(false);

        const backendMessage =
          typeof err?.error?.message === 'string'
            ? err.error.message
            : '';

        this.errorMessage.set(backendMessage || 'Registration failed');
      }
    });
  }
}
