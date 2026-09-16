import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { LucideCircleAlert, LucideCircleCheck, LucideImage, LucideTrash, LucideUpload, LucideX } from '@lucide/angular';
import { catchError, concatMap, EMPTY, finalize, from, tap } from 'rxjs';

import { GalleryImage, UploadItem, UploadStatus } from '../../core/models/gallery.model';
import { AuthService } from '../../core/services/auth.service';
import { GalleryService } from '../../core/services/gallery.service';
import { NotificationService } from '../../core/services/notification.service';
import { ACCEPTED_IMAGE_TYPES, validateFile } from '../../core/utils/file.util';
import { toFriendlyMessage } from '../../core/utils/http-error';
import { environment } from '../../../environments/environment';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { FileDropZone } from '../../shared/components/file-drop-zone/file-drop-zone';
import { ImageMagnifier } from '../../shared/components/image-magnifier/image-magnifier';
import { Loader } from '../../shared/components/loader/loader';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { UiButton } from '../../shared/components/ui-button/ui-button';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';

@Component({
  selector: 'app-gallery',
  imports: [
    PageHeader,
    FileDropZone,
    ImageMagnifier,
    EmptyState,
    Loader,
    UiButton,
    ConfirmDialog,
    FileSizePipe,
    LucideUpload,
    LucideImage,
    LucideTrash,
    LucideX,
    LucideCircleAlert,
    LucideCircleCheck,
  ],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})
export class Gallery {
  private readonly gallery = inject(GalleryService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly acceptedTypes = ACCEPTED_IMAGE_TYPES.join(',');
  protected readonly maxUploadMb = environment.maxUploadMb;

  protected readonly images = signal<GalleryImage[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly selectedId = signal<string | null>(null);

  protected readonly uploads = signal<UploadItem[]>([]);
  protected readonly uploading = signal(false);
  protected readonly pendingDelete = signal<GalleryImage | null>(null);
  protected readonly deleting = signal(false);

  /** Viewers can browse the gallery but not change it. */
  protected readonly canUpload = computed(() => this.auth.hasRole('admin', 'manager'));

  protected readonly selected = computed(
    () => this.images().find((image) => image.id === this.selectedId()) ?? this.images().at(0) ?? null,
  );
  protected readonly readyToUpload = computed(() => this.uploads().filter((item) => item.status === 'pending'));
  protected readonly rejected = computed(() => this.uploads().filter((item) => item.status === 'error'));

  constructor() {
    this.load();
    // Object URLs created for previews have to be released by hand.
    this.destroyRef.onDestroy(() => this.releasePreviews());
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.gallery
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (images) => this.images.set(images),
        error: (error: unknown) => this.errorMessage.set(toFriendlyMessage(error)),
      });
  }

  /** Validates every pick locally before anything is sent to the API. */
  protected onFilesSelected(files: File[]): void {
    const items: UploadItem[] = files.map((file) => {
      const error = validateFile(file, ACCEPTED_IMAGE_TYPES);
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: error ? 'error' : 'pending',
        error: error ?? undefined,
      };
    });

    this.uploads.update((current) => [...current, ...items]);

    const rejected = items.filter((item) => item.status === 'error').length;
    if (rejected) {
      this.notifications.error(`${rejected} file(s) were rejected. Check the messages below the preview.`);
    }
  }

  protected removeUpload(id: string): void {
    const item = this.uploads().find((upload) => upload.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    this.uploads.update((current) => current.filter((upload) => upload.id !== id));
  }

  protected clearUploads(): void {
    this.releasePreviews();
    this.uploads.set([]);
  }

  /** Uploads one file at a time so a partial failure is easy to report. */
  protected uploadAll(): void {
    const queue = this.readyToUpload();
    if (this.uploading() || !queue.length) return;

    const uploadedBy = this.auth.currentUser()?.name ?? 'Unknown';
    let succeeded = 0;
    let failed = 0;

    this.uploading.set(true);

    from(queue)
      .pipe(
        concatMap((item) => {
          this.setStatus(item.id, 'uploading');
          return this.gallery.upload(item.file, uploadedBy).pipe(
            tap((image) => {
              succeeded++;
              this.setStatus(item.id, 'success');
              this.images.update((images) => [image, ...images]);
              this.selectedId.set(image.id);
            }),
            catchError((error: unknown) => {
              failed++;
              this.setStatus(item.id, 'error', toFriendlyMessage(error));
              return EMPTY;
            }),
          );
        }),
        finalize(() => this.uploading.set(false)),
      )
      .subscribe({
        complete: () => {
          if (succeeded) {
            this.notifications.success(`${succeeded} image(s) uploaded.`);
            this.dropCompleted();
          }
          if (failed) {
            this.notifications.error(`${failed} image(s) could not be uploaded.`);
          }
        },
      });
  }

  protected select(image: GalleryImage): void {
    this.selectedId.set(image.id);
  }

  protected confirmDelete(image: GalleryImage): void {
    this.pendingDelete.set(image);
  }

  protected deleteImage(): void {
    const image = this.pendingDelete();
    if (!image || this.deleting()) return;

    this.deleting.set(true);
    this.gallery
      .remove(image.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.pendingDelete.set(null);
          this.images.update((images) => images.filter((candidate) => candidate.id !== image.id));
          if (this.selectedId() === image.id) this.selectedId.set(null);
          this.notifications.success(`"${image.name}" was deleted.`);
        },
        error: (error: unknown) => this.notifications.error(toFriendlyMessage(error)),
      });
  }

  private setStatus(id: string, status: UploadStatus, error?: string): void {
    this.uploads.update((current) =>
      current.map((item) => (item.id === id ? { ...item, status, error } : item)),
    );
  }

  private dropCompleted(): void {
    this.uploads.update((current) => {
      current.filter((item) => item.status === 'success').forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return current.filter((item) => item.status !== 'success');
    });
  }

  private releasePreviews(): void {
    this.uploads().forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }
}
