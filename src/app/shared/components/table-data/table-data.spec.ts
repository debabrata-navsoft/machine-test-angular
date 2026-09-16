import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnTemplate } from '../../directives/column-template';
import { TableColumn, TableData, TableSort } from './table-data';

interface Row {
  id: number;
  name: string;
  status: string;
}

@Component({
  imports: [TableData, ColumnTemplate],
  template: `
    <app-table-data
      [columns]="columns"
      [rows]="rows()"
      [loading]="loading()"
      [sort]="sort()"
      emptyTitle="No rows"
      (sortChange)="lastSort.set($event)"
    >
      <ng-template appColumnTemplate="status" let-row>
        <span class="pill">{{ row.status }}</span>
      </ng-template>
    </app-table-data>
  `,
})
class TableHost {
  readonly columns: TableColumn<Row>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status' },
  ];
  readonly rows = signal<Row[]>([
    { id: 1, name: 'Asha', status: 'active' },
    { id: 2, name: 'Manav', status: 'inactive' },
  ]);
  readonly loading = signal(false);
  readonly sort = signal<TableSort | null>({ key: 'name', order: 'asc' });
  readonly lastSort = signal<TableSort | null>(null);
}

describe('TableData', () => {
  let fixture: ComponentFixture<TableHost>;
  let host: TableHost;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TableHost] }).compileComponents();

    fixture = TestBed.createComponent(TableHost);
    host = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('renders one row per record', () => {
    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(element.querySelector('tbody tr td')?.textContent?.trim()).toBe('Asha');
  });

  it('renders custom markup for columns that declare a template', () => {
    const pills = element.querySelectorAll('.pill');

    expect(pills).toHaveLength(2);
    expect(pills[0].textContent?.trim()).toBe('active');
  });

  it('emits the next sort order when a sortable header is clicked', async () => {
    const header = element.querySelector<HTMLButtonElement>('th .sort');
    header?.click();
    await fixture.whenStable();

    expect(host.lastSort()).toEqual({ key: 'name', order: 'desc' });
  });

  it('does not make unsortable headers clickable', () => {
    expect(element.querySelectorAll('th .sort')).toHaveLength(1);
  });

  it('shows the empty state only when there are no rows and nothing is loading', async () => {
    host.rows.set([]);
    await fixture.whenStable();
    expect(element.textContent).toContain('No rows');

    host.loading.set(true);
    await fixture.whenStable();
    expect(element.textContent).not.toContain('No rows');
    expect(element.querySelector('.overlay')).toBeTruthy();
  });
});
