import { Component, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-badge',
  template: `<span [class]="'badge badge-' + tone()"><ng-content /></span>`,
  styles: `
    :host {
      display: inline-flex;
    }
  `,
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');
}
