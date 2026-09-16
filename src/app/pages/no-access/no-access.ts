import { Component, inject } from '@angular/core';
import { LucideShieldAlert } from '@lucide/angular';
import { Router } from '@angular/router';

import { ROLE_LABELS } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { UiButton } from '../../shared/components/ui-button/ui-button';

/** Where the role guard sends anyone without the rights for a route. */
@Component({
  selector: 'app-no-access',
  imports: [UiButton, LucideShieldAlert],
  template: `
    <div class="no-access card">
      <div class="card-body">
        <span class="icon"><svg lucideShieldAlert size="28"></svg></span>

        <h1>You do not have access to this page</h1>
        <p class="muted">
          @if (user(); as account) {
            Your account ({{ account.email }}) has the <strong>{{ roleLabel() }}</strong> role, which cannot open
            this section. Ask an administrator if you need wider access.
          } @else {
            Sign in with an account that has permission to open this section.
          }
        </p>

        <div class="actions">
          <app-ui-button (click)="goHome()">Back to dashboard</app-ui-button>
          <app-ui-button variant="secondary" (click)="signOut()">Sign in as someone else</app-ui-button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .no-access {
      max-width: 560px;
      margin: 40px auto;
      text-align: center;
    }

    .icon {
      display: inline-grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--danger-soft);
      color: var(--danger);
      margin-bottom: 14px;
    }

    h1 {
      font-size: 20px;
      margin-bottom: 8px;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      margin-top: 18px;
    }
  `,
})
export class NoAccess {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.currentUser;

  protected roleLabel(): string {
    const role = this.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  }

  protected goHome(): void {
    void this.router.navigate(['/dashboard']);
  }

  protected signOut(): void {
    this.auth.logout();
  }
}
