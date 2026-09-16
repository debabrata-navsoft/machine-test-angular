import { Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Single button style used across the app. `loading` also disables the button,
 * which is what stops double submits on every form and action in the project.
 */
@Component({
  selector: 'app-ui-button',
  template: `
    <button
      [type]="type()"
      [class]="'btn btn-' + variant() + ' btn-' + size() + (block() ? ' btn-block' : '')"
      [disabled]="disabled() || loading()"
    >
      @if (loading()) {
        <span class="btn-spinner" aria-hidden="true"></span>
      }
      <ng-content />
    </button>
  `,
  styleUrl: './ui-button.css',
})
export class UiButton {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<'sm' | 'md'>('md');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly block = input(false);
}
