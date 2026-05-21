import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonAuthService } from '../../auth/services/auth-service';
import { AdminProfile } from '../../auth/models/user';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.sass',
})
export class UserProfile implements OnInit {
  private authService = inject(CommonAuthService);
  private router = inject(Router);

  profile = signal<AdminProfile | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.authService.getAdminProfile().subscribe({
      next: (res) => {
        if (res.isSuccess && res.data) {
          this.profile.set(res.data);
        } else {
          this.error.set(res.message || 'Failed to load profile');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('An error occurred while loading profile settings.');
        this.loading.set(false);
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        // Fallback navigate to ensure user is redirected even if logout request fails
        this.router.navigate(['/']);
      },
    });
  }
}
