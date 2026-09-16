import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

const ADMIN = {
  id: 1,
  name: 'Asha Admin',
  email: 'admin@demo.com',
  password: 'Admin@123',
  role: 'admin',
  phone: '+91 98200 10001',
  department: 'Engineering',
  status: 'active',
  createdAt: '2026-01-02T09:00:00.000Z',
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('starts signed out when nothing is stored', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
  });

  it('looks the account up by email and password', () => {
    service.login({ email: ' Admin@Demo.com ', password: 'Admin@123' }).subscribe();

    const request = httpMock.expectOne((req) => req.url === `${environment.apiUrl}/users`);
    expect(request.request.params.get('email')).toBe('admin@demo.com');
    expect(request.request.params.get('password')).toBe('Admin@123');
    request.flush([ADMIN]);
  });

  it('opens a session and never exposes the password', () => {
    let emitted: User | undefined;
    service.login({ email: 'admin@demo.com', password: 'Admin@123' }).subscribe((user) => (emitted = user));
    httpMock.expectOne((req) => req.url === `${environment.apiUrl}/users`).flush([ADMIN]);

    expect(emitted?.name).toBe('Asha Admin');
    expect((emitted as unknown as Record<string, unknown>)['password']).toBeUndefined();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.token()).toBeTruthy();
    expect(localStorage.getItem('machine-test.session')).toContain('admin@demo.com');
  });

  it('rejects unknown credentials with a 401', () => {
    let error: HttpErrorResponse | undefined;
    service.login({ email: 'nobody@demo.com', password: 'wrong' }).subscribe({
      error: (err: HttpErrorResponse) => (error = err),
    });
    httpMock.expectOne((req) => req.url === `${environment.apiUrl}/users`).flush([]);

    expect(error?.status).toBe(401);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('refuses deactivated accounts', () => {
    let error: HttpErrorResponse | undefined;
    service.login({ email: 'admin@demo.com', password: 'Admin@123' }).subscribe({
      error: (err: HttpErrorResponse) => (error = err),
    });
    httpMock
      .expectOne((req) => req.url === `${environment.apiUrl}/users`)
      .flush([{ ...ADMIN, status: 'inactive' }]);

    expect(error?.status).toBe(403);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('answers role questions for the signed-in user', () => {
    service.login({ email: 'admin@demo.com', password: 'Admin@123' }).subscribe();
    httpMock.expectOne((req) => req.url === `${environment.apiUrl}/users`).flush([ADMIN]);

    expect(service.hasRole('admin')).toBe(true);
    expect(service.hasRole('admin', 'manager')).toBe(true);
    expect(service.hasRole('viewer')).toBe(false);
  });

  it('clears the stored session and returns to login on logout', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    service.login({ email: 'admin@demo.com', password: 'Admin@123' }).subscribe();
    httpMock.expectOne((req) => req.url === `${environment.apiUrl}/users`).flush([ADMIN]);

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('machine-test.session')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('ignores a stored session that has already expired', () => {
    localStorage.setItem(
      'machine-test.session',
      JSON.stringify({ token: 'x.y.z', expiresAt: Date.now() - 1000, user: ADMIN }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const restored = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    expect(restored.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('machine-test.session')).toBeNull();
  });
});
