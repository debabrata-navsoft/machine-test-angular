import { Component, input, output } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

/**
 * Thin wrapper around Angular Material's paginator so the rest of the app can
 * work with 1-based page numbers and stay independent of the Material API.
 */
@Component({
  selector: 'app-pagination',
  imports: [MatPaginator],
  template: `
    <mat-paginator
      [length]="total()"
      [pageIndex]="page() - 1"
      [pageSize]="pageSize()"
      [pageSizeOptions]="pageSizeOptions()"
      [disabled]="disabled()"
      showFirstLastButtons
      aria-label="Select page"
      (page)="onPage($event)"
    />
  `,
  styles: `
    :host {
      display: block;
      border-top: 1px solid var(--border);
    }

    mat-paginator {
      background: transparent;
    }
  `,
})
export class Pagination {
  /** 1-based, so it reads the same way in the URL and in the API request. */
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);
  readonly disabled = input(false);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected onPage(event: PageEvent): void {
    if (event.pageSize !== this.pageSize()) {
      this.pageSizeChange.emit(event.pageSize);
      return;
    }
    this.pageChange.emit(event.pageIndex + 1);
  }
}
