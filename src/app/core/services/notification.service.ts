import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type ToastKind = 'success' | 'error' | 'info';

const BASE_CONFIG: MatSnackBarConfig = {
  horizontalPosition: 'right',
  verticalPosition: 'bottom',
};

/** Application wide feedback messages, shown with Angular Material's snackbar. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open('success', message, 3500);
  }

  /** Errors stay a little longer - they usually need to be read. */
  error(message: string): void {
    this.open('error', message, 6000);
  }

  info(message: string): void {
    this.open('info', message, 4000);
  }

  private open(kind: ToastKind, message: string, duration: number): void {
    this.snackBar.open(message, 'Dismiss', {
      ...BASE_CONFIG,
      duration,
      panelClass: `snack-${kind}`,
    });
  }
}
