import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/**
 * Reads the roles allowed for a route from its `data.roles` and sends anyone
 * else to the "no access" page instead of silently failing.
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowed = (route.data['roles'] as UserRole[] | undefined) ?? [];
  if (auth.hasRole(...allowed)) {
    return true;
  }
  return router.createUrlTree(['/no-access'], { queryParams: { from: route.routeConfig?.path ?? '' } });
};
