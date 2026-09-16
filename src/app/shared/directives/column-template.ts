import { Directive, inject, input, TemplateRef } from '@angular/core';

/**
 * Supplies custom markup for a single column of `<app-table-data>`.
 *
 * Columns render plain text by default. When a column needs something richer
 * (a badge, a thumbnail, a link) the page declares a template for that column
 * key and the table renders it instead, passing the row as `$implicit`:
 *
 * ```html
 * <ng-template appColumnTemplate="role" let-user>
 *   <app-badge tone="primary">{{ user.role }}</app-badge>
 * </ng-template>
 * ```
 */
@Directive({ selector: '[appColumnTemplate]' })
export class ColumnTemplate<T = unknown> {
  /** Must match the `key` of the column it renders. */
  readonly appColumnTemplate = input.required<string>();

  readonly template = inject<TemplateRef<{ $implicit: T }>>(TemplateRef);
}
