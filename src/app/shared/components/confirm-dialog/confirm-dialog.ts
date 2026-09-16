import { Component, input, output } from '@angular/core';

import { Modal } from '../modal/modal';
import { UiButton } from '../ui-button/ui-button';

/** Confirmation used before any destructive action (delete user, file, folder). */
@Component({
  selector: 'app-confirm-dialog',
  imports: [Modal, UiButton],
  template: `
    <app-modal [title]="title()" size="sm" [busy]="loading()" (closed)="cancelled.emit()">
      <p>{{ message() }}</p>

      <div modalFooter>
        <app-ui-button variant="secondary" [disabled]="loading()" (click)="cancelled.emit()">
          {{ cancelLabel() }}
        </app-ui-button>
        <app-ui-button [variant]="tone()" [loading]="loading()" (click)="confirmed.emit()">
          {{ confirmLabel() }}
        </app-ui-button>
      </div>
    </app-modal>
  `,
})
export class ConfirmDialog {
  readonly title = input('Are you sure?');
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly tone = input<'primary' | 'danger'>('danger');
  readonly loading = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
