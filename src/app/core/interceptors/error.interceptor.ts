import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { toFriendlyMessage } from '../utils/http-error';

/**
 * Handles the failures nobody can act on locally - an expired session, an
 * unreachable API, a server fault. Validation style errors (4xx) are passed
 * through so the screen that made the call can show them in context.
 */
export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const notifications = inject(NotificationService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        notifications.error('Your session has expired. Please sign in again.');
        auth.handleExpiredSession();
      } else if (error.status === 0 || error.status >= 500) {
        notifications.error(toFriendlyMessage(error));
      }

      return throwError(() => error);
    }),
  );
};
