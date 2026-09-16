import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideEye, LucidePencil, LucidePlus, LucideTrash } from '@lucide/angular';
import { catchError, of, Subject, switchMap, tap } from 'rxjs';

import { emptyPage, PagedResult } from '../../core/models/api.model';
import {
  ROLE_LABELS,
  User,
  UserPayload,
  UserQuery,
  UserRole,
  USER_ROLES,
  USER_STATUSES,
} from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserService } from '../../core/services/user.service';
import { toFriendlyMessage } from '../../core/utils/http-error';
import { Badge } from '../../shared/components/badge/badge';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { Pagination } from '../../shared/components/pagination/pagination';
import { SearchInput } from '../../shared/components/search-input/search-input';
import { TableColumn, TableData, TableSort } from '../../shared/components/table-data/table-data';
import { UiButton } from '../../shared/components/ui-button/ui-button';
import { ColumnTemplate } from '../../shared/directives/column-template';
import { UserDetails } from './user-details/user-details';
import { UserForm } from './user-form/user-form';

const DEFAULT_QUERY: UserQuery = {
  page: 1,
  pageSize: 10,
  search: '',
  role: '',
  status: '',
  sort: 'name',
  order: 'asc',
};

type DialogState = { mode: 'create' } | { mode: 'edit' | 'view'; user: User } | null;

@Component({
  selector: 'app-users',
  imports: [
    DatePipe,
    PageHeader,
    SearchInput,
    TableData,
    ColumnTemplate,
    Pagination,
    Badge,
    UiButton,
    ConfirmDialog,
    UserForm,
    UserDetails,
    LucidePlus,
    LucideEye,
    LucidePencil,
    LucideTrash,
  ],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users {
  private readonly users = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  protected readonly roles = USER_ROLES;
  protected readonly statuses = USER_STATUSES;
  protected readonly roleLabels = ROLE_LABELS;

  /** Rows arrive untyped from the column templates, so the lookup lives here. */
  protected roleLabel(user: User): string {
    return ROLE_LABELS[user.role];
  }

  protected readonly query = signal<UserQuery>(DEFAULT_QUERY);
  protected readonly result = signal<PagedResult<User>>(emptyPage<User>());
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly dialog = signal<DialogState>(null);
  protected readonly pendingDelete = signal<User | null>(null);
  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);

  /** Only administrators may change user records; managers get a read-only list. */
  protected readonly canManage = computed(() => this.auth.hasRole('admin'));
  protected readonly hasFilters = computed(() => {
    const query = this.query();
    return Boolean(query.search || query.role || query.status);
  });

  protected readonly columns: TableColumn<User>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: true, width: '130px' },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'status', label: 'Status', sortable: true, width: '110px' },
    { key: 'createdAt', label: 'Created', sortable: true, width: '130px' },
  ];

  private readonly requests = new Subject<UserQuery>();

  constructor() {
    // switchMap drops the response of a request the user has already replaced.
    this.requests
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set('');
        }),
        switchMap((query) =>
          this.users.list(query).pipe(
            catchError((error: unknown) => {
              this.errorMessage.set(toFriendlyMessage(error));
              return of(emptyPage<User>(query.page, query.pageSize));
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.result.set(result);
        this.loading.set(false);
      });

    this.reload();
  }

  protected reload(): void {
    this.requests.next(this.query());
  }

  private patchQuery(patch: Partial<UserQuery>): void {
    this.query.update((query) => ({ ...query, ...patch }));
    this.reload();
  }

  protected onSearch(search: string): void {
    this.patchQuery({ search, page: 1 });
  }

  protected onRoleFilter(event: Event): void {
    this.patchQuery({ role: (event.target as HTMLSelectElement).value as UserRole | '', page: 1 });
  }

  protected onStatusFilter(event: Event): void {
    this.patchQuery({ status: (event.target as HTMLSelectElement).value as 'active' | 'inactive' | '', page: 1 });
  }

  protected onSort(sort: TableSort): void {
    this.patchQuery({ sort: sort.key, order: sort.order, page: 1 });
  }

  protected onPage(page: number): void {
    this.patchQuery({ page });
  }

  protected onPageSize(pageSize: number): void {
    this.patchQuery({ pageSize, page: 1 });
  }

  protected clearFilters(): void {
    this.query.set(DEFAULT_QUERY);
    this.reload();
  }

  protected currentSort(): TableSort {
    const query = this.query();
    return { key: query.sort, order: query.order };
  }

  protected openCreate(): void {
    this.dialog.set({ mode: 'create' });
  }

  protected openEdit(user: User): void {
    this.dialog.set({ mode: 'edit', user });
  }

  protected openView(user: User): void {
    this.dialog.set({ mode: 'view', user });
  }

  protected closeDialog(): void {
    if (!this.saving()) {
      this.dialog.set(null);
    }
  }

  protected saveUser(payload: UserPayload): void {
    const state = this.dialog();
    if (this.saving() || !state || state.mode === 'view') return;

    this.saving.set(true);
    const request =
      state.mode === 'edit' ? this.users.update(state.user.id, payload) : this.users.create(payload);

    request.subscribe({
      next: (user) => {
        this.saving.set(false);
        this.dialog.set(null);
        this.notifications.success(
          state.mode === 'edit' ? `${user.name} was updated.` : `${user.name} was added.`,
        );
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.notifications.error(toFriendlyMessage(error));
      },
    });
  }

  protected confirmDelete(user: User): void {
    this.pendingDelete.set(user);
  }

  protected deleteUser(): void {
    const user = this.pendingDelete();
    if (!user || this.deleting()) return;

    this.deleting.set(true);
    this.users.remove(user.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.notifications.success(`${user.name} was deleted.`);

        // Stepping back a page keeps the list from showing an empty last page.
        const remaining = this.result().total - 1;
        const lastPage = Math.max(1, Math.ceil(remaining / this.query().pageSize));
        this.patchQuery({ page: Math.min(this.query().page, lastPage) });
      },
      error: (error: unknown) => {
        this.deleting.set(false);
        this.notifications.error(toFriendlyMessage(error));
      },
    });
  }
}
