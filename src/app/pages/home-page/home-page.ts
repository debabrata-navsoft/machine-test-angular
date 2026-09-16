import { Component, computed, inject, signal } from '@angular/core';
import { LucideChevronRight, LucideHardDrive, LucideImage, LucideUsers } from '@lucide/angular';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';

import { ROLE_LABELS } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { DriveService } from '../../core/services/drive.service';
import { GalleryService } from '../../core/services/gallery.service';
import { UserService } from '../../core/services/user.service';
import { toFriendlyMessage } from '../../core/utils/http-error';
import { Badge } from '../../shared/components/badge/badge';
import { PageHeader } from '../../shared/components/page-header/page-header';

interface DashboardStats {
  users: number;
  images: number;
  folders: number;
  files: number;
}

/** Landing page after sign in: a short summary plus links into each feature. */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, PageHeader, Badge, LucideUsers, LucideImage, LucideHardDrive, LucideChevronRight],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  private readonly auth = inject(AuthService);
  private readonly users = inject(UserService);
  private readonly gallery = inject(GalleryService);
  private readonly drive = inject(DriveService);

  protected readonly user = this.auth.currentUser;
  protected readonly stats = signal<DashboardStats>({ users: 0, images: 0, folders: 0, files: 0 });
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');

  protected readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });
  protected readonly canSeeUsers = computed(() => this.auth.hasRole('admin', 'manager'));

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    // One request per tile; a single failure should not blank the whole page.
    forkJoin({
      users: this.users
        .list({ page: 1, pageSize: 1, search: '', role: '', status: '', sort: 'id', order: 'asc' })
        .pipe(catchError(() => of({ items: [], total: 0, page: 1, pageSize: 1 }))),
      images: this.gallery.list().pipe(catchError(() => of([]))),
      drive: this.drive.countAll().pipe(catchError(() => of({ folders: 0, files: 0 }))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ users, images, drive }) =>
          this.stats.set({ users: users.total, images: images.length, folders: drive.folders, files: drive.files }),
        error: (error: unknown) => this.errorMessage.set(toFriendlyMessage(error)),
      });
  }
}
