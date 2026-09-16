import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideHardDrive,
  LucideImage,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideMenu,
  LucideUsers,
  LucideX,
} from '@lucide/angular';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { LoadingService } from '../../core/services/loading.service';
import { Badge } from '../../shared/components/badge/badge';
import { UiButton } from '../../shared/components/ui-button/ui-button';

interface NavItem {
  path: string;
  label: string;
  icon: 'dashboard' | 'users' | 'gallery' | 'drive';
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/users', label: 'User management', icon: 'users', roles: ['admin', 'manager'] },
  { path: '/gallery', label: 'Image gallery', icon: 'gallery' },
  { path: '/drive', label: 'Files & folders', icon: 'drive' },
];

/** Header, navigation and page frame for every signed-in route. */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Badge,
    UiButton,
    LucideLayoutDashboard,
    LucideUsers,
    LucideImage,
    LucideHardDrive,
    LucideLogOut,
    LucideMenu,
    LucideX,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = inject(LoadingService).isLoading;
  protected readonly user = this.auth.currentUser;
  protected readonly menuOpen = signal(false);

  /** Only the entries the signed-in role may open. */
  protected readonly navItems = computed(() =>
    NAV_ITEMS.filter((item) => !item.roles || this.auth.hasRole(...item.roles)),
  );

  constructor() {
    // Navigating on a phone should leave the drawer closed behind you.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected logout(): void {
    this.auth.logout();
  }
}
