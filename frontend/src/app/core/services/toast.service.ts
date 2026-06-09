import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toast = signal<ToastMessage | null>(null);

  private dismissTimer?: ReturnType<typeof setTimeout>;

  error(message: string, title = 'Something went wrong'): void {
    clearTimeout(this.dismissTimer);
    this.toast.set({ title, message });
    this.dismissTimer = setTimeout(() => this.dismiss(), 6000);
  }

  dismiss(): void {
    clearTimeout(this.dismissTimer);
    this.toast.set(null);
  }
}
