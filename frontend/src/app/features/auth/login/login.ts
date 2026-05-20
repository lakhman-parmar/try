import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { InputComponent } from '../../../shared/components/input/input';

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

    console.log('Login attempt with:', formData);

    // TODO: Replace with actual API call
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1500);
  }

  // Getters
  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }
}
