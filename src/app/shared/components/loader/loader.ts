import { Component, input } from '@angular/core';

/** Spinner used while data or files are loading. */
@Component({
  selector: 'app-loader',
  template: `
    <div class="loader" role="status" [attr.aria-label]="label()">
      <span class="ring" aria-hidden="true"></span>
      @if (label()) {
        <span class="label">{{ label() }}</span>
      }
    </div>
  `,
  styles: `
    .loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 28px 16px;
      color: var(--text-muted);
      font-size: 14px;
    }

    .ring {
      width: 26px;
      height: 26px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class Loader {
  readonly label = input('Loading…');
}
