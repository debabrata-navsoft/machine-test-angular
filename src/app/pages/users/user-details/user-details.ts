import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { ROLE_LABELS, User } from '../../../core/models/user.model';
import { Badge } from '../../../shared/components/badge/badge';
import { Modal } from '../../../shared/components/modal/modal';
import { UiButton } from '../../../shared/components/ui-button/ui-button';

/** Read-only view of a single user. */
@Component({
  selector: 'app-user-details',
  imports: [DatePipe, Modal, Badge, UiButton],
  template: `
    <app-modal title="User details" size="sm" (closed)="closed.emit()">
      <dl class="details">
        <dt>Name</dt>
        <dd>{{ user().name }}</dd>

        <dt>Email</dt>
        <dd class="truncate">{{ user().email }}</dd>

        <dt>Phone</dt>
        <dd>{{ user().phone || '—' }}</dd>

        <dt>Department</dt>
        <dd>{{ user().department }}</dd>

        <dt>Role</dt>
        <dd><app-badge tone="primary">{{ roleLabel() }}</app-badge></dd>

        <dt>Status</dt>
        <dd>
          <app-badge [tone]="user().status === 'active' ? 'success' : 'warning'">{{ user().status }}</app-badge>
        </dd>

        <dt>Created</dt>
        <dd>{{ user().createdAt | date: 'medium' }}</dd>
      </dl>

      <div modalFooter>
        <app-ui-button variant="secondary" (click)="closed.emit()">Close</app-ui-button>
      </div>
    </app-modal>
  `,
  styles: `
    .details {
      display: grid;
      grid-template-columns: 110px minmax(0, 1fr);
      gap: 10px 16px;
      margin: 0;
      font-size: 14px;
    }

    dt {
      color: var(--text-muted);
      font-weight: 600;
    }

    dd {
      margin: 0;
    }
  `,
})
export class UserDetails {
  readonly user = input.required<User>();
  readonly closed = output<void>();

  protected roleLabel(): string {
    return ROLE_LABELS[this.user().role];
  }
}
