import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-home">
      <h1>Admin Home</h1>
      <p>You are signed in as an admin.</p>
    </div>
  `,
})
export class AdminHome {}
