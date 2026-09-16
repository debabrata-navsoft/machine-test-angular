import { Component, input } from '@angular/core';
import { LucideInbox } from '@lucide/angular';

/**
 * Shown when a list has no records, or a search returned nothing.
 * Pages can replace the icon by projecting one: `<svg lucideUsers emptyIcon>`.
 */
@Component({
  selector: 'app-empty-state',
  imports: [LucideInbox],
  template: `
    <div class="empty">
      <span class="icon">
        <ng-content select="[emptyIcon]">
          <svg lucideInbox size="30"></svg>
        </ng-content>
      </span>

      <p class="title">{{ title() }}</p>
      @if (message()) {
        <p class="message">{{ message() }}</p>
      }

      <ng-content />
    </div>
  `,
  styles: `
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 40px 20px;
      text-align: center;
    }

    .icon {
      display: inline-flex;
      color: var(--text-muted);
    }

    .title {
      font-weight: 600;
    }

    .message {
      color: var(--text-muted);
      font-size: 14px;
      max-width: 42ch;
    }

    .empty ::ng-deep app-ui-button {
      margin-top: 10px;
    }
  `,
})
export class EmptyState {
  readonly title = input('Nothing here yet');
  readonly message = input('');
}
