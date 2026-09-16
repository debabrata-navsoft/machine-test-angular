import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Credentials, Session } from '../models/auth.model';
import { User, UserRole } from '../models/user.model';
import { NotificationService } from './notification.service';

const SESSION_KEY = 'machine-test.session';

/**
 * json-server has no auth endpoint, so the login call looks the credentials up
 * in the `users` collection and this service mints the session token itself.
 * The token is a signed-free, base64 encoded JWT-like payload: it is enough to
 * exercise the interceptor, the guards and expiry handling, and nothing more.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  private readonly session = signal<Session | null>(readStoredSession());
  private expiryTimer?: ReturnType<typeof setTimeout>;

  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly role = computed<UserRole | null>(() => this.currentUser()?.role ?? null);

  constructor() {
    const restored = this.session();
    if (restored) {
      this.scheduleExpiry(restored.expiresAt);
    }
  }

  login({ email, password }: Credentials): Observable<User> {
    const params = new HttpParams().set('email', email.trim().toLowerCase()).set('password', password);

    return this.http.get<(User & { password?: string })[]>(`${environment.apiUrl}/users`, { params }).pipe(
      map((matches) => {
        const account = matches.at(0);
        if (!account) {
          throw new HttpErrorResponse({ status: 401, error: { message: 'Invalid email or password.' } });
        }
        if (account.status !== 'active') {
          throw new HttpErrorResponse({
            status: 403,
            error: { message: 'This account has been deactivated. Contact an administrator.' },
          });
        }
        return withoutPassword(account);
      }),
      tap((user) => this.openSession(user)),
    );
  }

  logout(redirectTo = '/login'): void {
    clearTimeout(this.expiryTimer);
    this.session.set(null);
    localStorage.removeItem(SESSION_KEY);
    void this.router.navigate([redirectTo]);
  }

  /** Called by the HTTP interceptor when the API rejects the stored token. */
  handleExpiredSession(): void {
    if (this.session()) {
      this.logout();
    }
  }

  token(): string | null {
    const session = this.session();
    return session && session.expiresAt > Date.now() ? session.token : null;
  }

  hasRole(...roles: readonly UserRole[]): boolean {
    const role = this.role();
    return role !== null && (roles.length === 0 || roles.includes(role));
  }

  private openSession(user: User): void {
    const expiresAt = Date.now() + environment.sessionMinutes * 60_000;
    const session: Session = { token: createToken(user, expiresAt), expiresAt, user };

    this.session.set(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.scheduleExpiry(expiresAt);
  }

  /** Signs the user out the moment the token expires, without waiting for a 401. */
  private scheduleExpiry(expiresAt: number): void {
    clearTimeout(this.expiryTimer);

    this.expiryTimer = setTimeout(
      () => {
        this.notifications.info('Your session has expired. Please sign in again.');
        this.logout();
      },
      Math.max(0, expiresAt - Date.now()),
    );
  }
}

function withoutPassword(account: User & { password?: string }): User {
  const { password, ...user } = account;
  return user;
}

function createToken(user: User, expiresAt: number): string {
  const header = base64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({ sub: user.id, email: user.email, role: user.role, exp: Math.floor(expiresAt / 1000) }),
  );
  return `${header}.${payload}.mock`;
}

function base64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as Session;
    if (!session?.token || !session.user || session.expiresAt <= Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}
