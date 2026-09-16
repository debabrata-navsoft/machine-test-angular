import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, contentChild, contentChildren, input, output, TemplateRef } from '@angular/core';
import { LucideArrowDown, LucideArrowUp, LucideArrowUpDown } from '@lucide/angular';

import { ColumnTemplate } from '../../directives/column-template';
import { EmptyState } from '../empty-state/empty-state';
import { Loader } from '../loader/loader';

export interface TableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'right' | 'center';
  /** Derives the displayed text when it is not simply `row[key]`. */
  value?: (row: T) => string | number | null | undefined;
}

export interface TableSort {
  key: string;
  order: 'asc' | 'desc';
}

/**
 * Generic data table shared by every list in the app. It owns the loading,
 * empty and sorting UI; paging and fetching stay with the page that uses it.
 */
@Component({
  selector: 'app-table-data',
  imports: [NgTemplateOutlet, EmptyState, Loader, LucideArrowUp, LucideArrowDown, LucideArrowUpDown],
  templateUrl: './table-data.html',
  styleUrl: './table-data.css',
})
export class TableData<T extends { id: string | number }> {
  readonly columns = input.required<TableColumn<T>[]>();
  readonly rows = input.required<readonly T[]>();
  readonly loading = input(false);
  readonly sort = input<TableSort | null>(null);
  readonly emptyTitle = input('No records found');
  readonly emptyMessage = input('Try changing your search or filters.');

  readonly sortChange = output<TableSort>();

  /** `<ng-template #rowActions let-row>` renders the per-row action buttons. */
  protected readonly rowActions = contentChild<TemplateRef<{ $implicit: T }>>('rowActions');

  private readonly columnTemplates = contentChildren(ColumnTemplate<T>);
  private readonly templatesByColumn = computed(
    () => new Map(this.columnTemplates().map((def) => [def.appColumnTemplate(), def.template])),
  );

  protected readonly showEmptyState = computed(() => !this.loading() && this.rows().length === 0);

  protected templateFor(key: string): TemplateRef<{ $implicit: T }> | undefined {
    return this.templatesByColumn().get(key);
  }

  protected display(row: T, column: TableColumn<T>): string {
    const raw = column.value ? column.value(row) : (row as Record<string, unknown>)[column.key];
    return raw === null || raw === undefined || raw === '' ? '—' : String(raw);
  }

  protected sortState(key: string): 'asc' | 'desc' | 'none' {
    const sort = this.sort();
    return sort?.key === key ? sort.order : 'none';
  }

  protected toggleSort(column: TableColumn<T>): void {
    if (!column.sortable) return;

    const sort = this.sort();
    const order = sort?.key === column.key && sort.order === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ key: column.key, order });
  }
}
