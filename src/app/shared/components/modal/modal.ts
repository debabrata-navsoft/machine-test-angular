import { Component, input, output } from '@angular/core';
import { LucideX } from '@lucide/angular';

/** Accessible dialog shell reused by every popup in the app. */
@Component({
  selector: 'app-modal',
  imports: [LucideX],
  host: { '(document:keydown.escape)': 'dismiss()' },
  template: `
    <div class="backdrop" (click)="onBackdropClick($event)">
      <div class="dialog" [class]="'dialog-' + size()" role="dialog" aria-modal="true" [attr.aria-label]="title()">
        <header class="head">
          <h2>{{ title() }}</h2>
          <button type="button" class="close" aria-label="Close dialog" (click)="dismiss()">
            <svg lucideX size="18"></svg>
          </button>
        </header>

        <div class="body">
          <ng-content />
        </div>

        <footer class="foot">
          <ng-content select="[modalFooter]" />
        </footer>
      </div>
    </div>
  `,
  styleUrl: './modal.css',
})
export class Modal {
  readonly title = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Set while a request is running so the dialog cannot be closed mid-save. */
  readonly busy = input(false);

  readonly closed = output<void>();

  protected dismiss(): void {
    if (!this.busy()) {
      this.closed.emit();
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.dismiss();
    }
  }
}
