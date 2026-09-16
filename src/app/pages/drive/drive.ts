import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideChevronRight,
  LucideDownload,
  LucideEye,
  LucideFile,
  LucideFolder,
  LucideFolderPlus,
  LucideHouse,
  LucidePencil,
  LucideTrash,
} from '@lucide/angular';
import { catchError, concatMap, EMPTY, finalize, from, of, Subject, switchMap, tap } from 'rxjs';

import { Breadcrumb, DRIVE_ROOT, DriveNode } from '../../core/models/drive.model';
import { AuthService } from '../../core/services/auth.service';
import { DriveService } from '../../core/services/drive.service';
import { NotificationService } from '../../core/services/notification.service';
import { ACCEPTED_FILE_TYPES, validateFile } from '../../core/utils/file.util';
import { toFriendlyMessage } from '../../core/utils/http-error';
import { environment } from '../../../environments/environment';
import { Badge } from '../../shared/components/badge/badge';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { FileDropZone } from '../../shared/components/file-drop-zone/file-drop-zone';
import { Loader } from '../../shared/components/loader/loader';
import { Modal } from '../../shared/components/modal/modal';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { SearchInput } from '../../shared/components/search-input/search-input';
import { UiButton } from '../../shared/components/ui-button/ui-button';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';

interface Location {
  parentId: string;
  search: string;
}

type NameDialog = { mode: 'create' } | { mode: 'rename'; node: DriveNode } | null;

@Component({
  selector: 'app-drive',
  imports: [
    PageHeader,
    SearchInput,
    FileDropZone,
    EmptyState,
    Loader,
    Modal,
    ConfirmDialog,
    Badge,
    UiButton,
    FileSizePipe,
    LucideFolder,
    LucideFolderPlus,
    LucideFile,
    LucideHouse,
    LucideChevronRight,
    LucideEye,
    LucidePencil,
    LucideTrash,
    LucideDownload,
  ],
  templateUrl: './drive.html',
  styleUrl: './drive.css',
})
export class Drive {
  private readonly drive = inject(DriveService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  protected readonly acceptedTypes = ACCEPTED_FILE_TYPES.join(',');
  protected readonly maxUploadMb = environment.maxUploadMb;

  protected readonly location = signal<Location>({ parentId: DRIVE_ROOT, search: '' });
  protected readonly items = signal<DriveNode[]>([]);
  protected readonly breadcrumbs = signal<Breadcrumb[]>([]);
  protected readonly isSearchResult = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  protected readonly nameDialog = signal<NameDialog>(null);
  protected readonly nameValue = signal('');
  protected readonly nameError = signal('');
  protected readonly savingName = signal(false);

  protected readonly pendingDelete = signal<DriveNode | null>(null);
  protected readonly deleting = signal(false);
  protected readonly preview = signal<DriveNode | null>(null);
  protected readonly uploading = signal(false);

  /** Viewers browse only; admins and managers can change the tree. */
  protected readonly canManage = computed(() => this.auth.hasRole('admin', 'manager'));
  protected readonly folders = computed(() => this.items().filter((node) => node.type === 'folder'));
  protected readonly files = computed(() => this.items().filter((node) => node.type === 'file'));

  private readonly requests = new Subject<Location>();

  constructor() {
    this.requests
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set('');
        }),
        switchMap((location) =>
          this.drive.listing(location.parentId, location.search).pipe(
            catchError((error: unknown) => {
              this.errorMessage.set(toFriendlyMessage(error));
              return of({ parentId: location.parentId, items: [], breadcrumbs: [], isSearch: false });
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((listing) => {
        this.items.set(listing.items);
        this.breadcrumbs.set(listing.breadcrumbs);
        this.isSearchResult.set(listing.isSearch);
        this.loading.set(false);
      });

    this.reload();
  }

  protected reload(): void {
    this.requests.next(this.location());
  }

  protected openFolder(node: DriveNode): void {
    if (node.type !== 'folder') return;
    this.location.set({ parentId: node.id, search: '' });
    this.reload();
  }

  protected navigateTo(parentId: string): void {
    this.location.set({ parentId, search: '' });
    this.reload();
  }

  protected onSearch(search: string): void {
    this.location.update((location) => ({ ...location, search }));
    this.reload();
  }

  /* ------------------------------------------------------------- folders */

  protected openCreateFolder(): void {
    this.nameValue.set('');
    this.nameError.set('');
    this.nameDialog.set({ mode: 'create' });
  }

  protected openRename(node: DriveNode): void {
    this.nameValue.set(node.name);
    this.nameError.set('');
    this.nameDialog.set({ mode: 'rename', node });
  }

  protected closeNameDialog(): void {
    if (!this.savingName()) this.nameDialog.set(null);
  }

  protected submitName(): void {
    const dialog = this.nameDialog();
    const name = this.nameValue().trim();
    if (!dialog || this.savingName()) return;

    if (!name) {
      this.nameError.set('A name is required.');
      return;
    }
    if (name.length > 60) {
      this.nameError.set('Use 60 characters or fewer.');
      return;
    }

    this.savingName.set(true);
    this.nameError.set('');

    const request =
      dialog.mode === 'create'
        ? this.drive.createFolder(name, this.location().parentId)
        : this.drive.rename(dialog.node, name);

    request.pipe(finalize(() => this.savingName.set(false))).subscribe({
      next: () => {
        this.nameDialog.set(null);
        this.notifications.success(dialog.mode === 'create' ? `Folder "${name}" created.` : `Renamed to "${name}".`);
        this.reload();
      },
      error: (error: unknown) => this.nameError.set(toFriendlyMessage(error)),
    });
  }

  /* --------------------------------------------------------------- files */

  protected onFilesSelected(files: File[]): void {
    if (this.uploading()) return;

    const accepted: File[] = [];
    files.forEach((file) => {
      const error = validateFile(file, ACCEPTED_FILE_TYPES);
      if (error) this.notifications.error(error);
      else accepted.push(file);
    });

    if (!accepted.length) return;

    const parentId = this.location().parentId;
    let succeeded = 0;
    let failed = 0;
    this.uploading.set(true);

    from(accepted)
      .pipe(
        concatMap((file) =>
          this.drive.uploadFile(file, parentId).pipe(
            tap(() => succeeded++),
            catchError((error: unknown) => {
              failed++;
              this.notifications.error(toFriendlyMessage(error));
              return EMPTY;
            }),
          ),
        ),
        finalize(() => this.uploading.set(false)),
      )
      .subscribe({
        complete: () => {
          if (succeeded) {
            this.notifications.success(`${succeeded} file(s) uploaded.`);
            this.reload();
          }
          if (failed && !succeeded) {
            this.errorMessage.set('No files could be uploaded.');
          }
        },
      });
  }

  protected openPreview(node: DriveNode): void {
    this.preview.set(node);
  }

  protected isImage(node: DriveNode): boolean {
    return Boolean(node.mimeType?.startsWith('image/'));
  }

  /* -------------------------------------------------------------- delete */

  protected confirmDelete(node: DriveNode): void {
    this.pendingDelete.set(node);
  }

  protected deleteMessage(node: DriveNode): string {
    return node.type === 'folder'
      ? `Delete the folder "${node.name}" and everything inside it? This cannot be undone.`
      : `Delete "${node.name}"? This cannot be undone.`;
  }

  protected deleteNode(): void {
    const node = this.pendingDelete();
    if (!node || this.deleting()) return;

    this.deleting.set(true);
    this.drive
      .remove(node)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: (removed) => {
          this.pendingDelete.set(null);
          this.notifications.success(
            node.type === 'folder' ? `"${node.name}" and ${removed - 1} item(s) deleted.` : `"${node.name}" deleted.`,
          );
          this.reload();
        },
        error: (error: unknown) => this.notifications.error(toFriendlyMessage(error)),
      });
  }
}
