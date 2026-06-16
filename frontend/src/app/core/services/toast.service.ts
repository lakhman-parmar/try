import { Injectable, signal } from '@angular/core';

export type ToastType = 'error' | 'warning' | 'info' | 'success';

export interface ToastMessage {
  title: string;
  message: string;
  type: ToastType;
}

const DISMISS_MS: Record<ToastType, number> = {
  error: 8000,
  warning: 6000,
  info: 5000,
  success: 4000,
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toast = signal<ToastMessage | null>(null);

  private dismissTimer?: ReturnType<typeof setTimeout>;

  error(message: string, title = 'Something went wrong'): void {
    this.show({ title, message, type: 'error' });
  }

  warning(message: string, title = 'Caution'): void {
    this.show({ title, message, type: 'warning' });
  }

  info(message: string, title = 'Heads up'): void {
    this.show({ title, message, type: 'info' });
  }

  success(message: string, title = 'Success'): void {
    this.show({ title, message, type: 'success' });
  }

  show(msg: ToastMessage): void {
    clearTimeout(this.dismissTimer);
    this.toast.set(msg);
    this.dismissTimer = setTimeout(() => this.dismiss(), DISMISS_MS[msg.type]);
  }

  dismiss(): void {
    clearTimeout(this.dismissTimer);
    this.toast.set(null);
  }
}
