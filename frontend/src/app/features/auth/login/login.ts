import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { InputComponent } from '../../../shared/components/input/input';
import { CommonAuthService } from '../services/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  // Services
  private fb = inject(FormBuilder);
  private authService = inject(CommonAuthService);
  private router = inject(Router);

  // Signals
  isLoading = signal(false);
  errorMessage = signal('');

  // Form
  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(15)]],
  });

  onLogin(): void {
    this.errorMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      this.errorMessage.set('Please fill in all required fields correctly');

      return;
    }

    this.isLoading.set(true);

    const formData = this.loginForm.getRawValue();

    this.authService
      .admin_login(formData.email, formData.password)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess) {
            this.authService.setToken(res.data.token);
            this.router.navigate(['/admin']);
            return;
          }

          this.errorMessage.set(res.message || 'Invalid credentials');
        },
        error: (err) => {
          const message = err?.error?.message || err?.message || 'Login failed. Please try again.';
          this.errorMessage.set(message);
        },
      });
  }

  // Getters
  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }
}
