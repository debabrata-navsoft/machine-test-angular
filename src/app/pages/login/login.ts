import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideEye, LucideEyeOff, LucideLock, LucideMail, LucideShieldAlert } from '@lucide/angular';
import { ActivatedRoute, Router } from '@angular/router';

import { Credentials } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { toFriendlyMessage } from '../../core/utils/http-error';
import { UiButton } from '../../shared/components/ui-button/ui-button';

const DEMO_ACCOUNTS: (Credentials & { role: string })[] = [
  { role: 'Administrator', email: 'admin@demo.com', password: 'Admin@123' },
  { role: 'Manager', email: 'manager@demo.com', password: 'Manager@123' },
  { role: 'Viewer', email: 'viewer@demo.com', password: 'Viewer@123' },
];

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, UiButton, LucideMail, LucideLock, LucideEye, LucideEyeOff, LucideShieldAlert],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly demoAccounts = DEMO_ACCOUNTS;
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected isInvalid(control: 'email' | 'password'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.dirty || field.touched);
  }

  protected useAccount(account: Credentials): void {
    this.form.setValue({ email: account.email, password: account.password });
    this.errorMessage.set('');
  }

  protected submit(): void {
    // Guard against a second submit while the first request is in flight.
    if (this.submitting()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.notifications.success(`Welcome back, ${user.name.split(' ').at(0)}.`);
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') ?? '/dashboard';
        void this.router.navigateByUrl(redirectTo);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(toFriendlyMessage(error));
      },
    });
  }
}
