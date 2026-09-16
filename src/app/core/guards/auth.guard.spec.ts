import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

function runGuard(isAuthenticated: boolean): boolean | UrlTree {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthService, useValue: { isAuthenticated: () => isAuthenticated } }],
  });

  return TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, { url: '/users' } as RouterStateSnapshot),
  ) as boolean | UrlTree;
}

describe('authGuard', () => {
  it('lets a signed-in visitor through', () => {
    expect(runGuard(true)).toBe(true);
  });

  it('redirects to login and remembers the requested page', () => {
    const result = runGuard(false);

    expect(result).toBeInstanceOf(UrlTree);
    expect(String(result)).toBe('/login?redirectTo=%2Fusers');
  });
});
