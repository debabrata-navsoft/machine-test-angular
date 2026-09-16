import { HttpErrorResponse } from '@angular/common/http';

/** Turns any HTTP failure into a sentence we are happy to show a user. */
export function toFriendlyMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.';
  }

  const fromBody = typeof error.error === 'object' && error.error !== null ? error.error['message'] : null;
  if (typeof fromBody === 'string' && fromBody.trim()) {
    return fromBody;
  }

  switch (error.status) {
    case 0:
      return 'Cannot reach the API. Make sure the mock server is running (npm run api).';
    case 400:
      return 'The request was rejected. Please check the values you entered.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested record no longer exists.';
    case 409:
      return 'That record conflicts with an existing one.';
    case 422:
      return 'Please correct the highlighted fields.';
    default:
      return error.status >= 500
        ? 'The server could not complete the request. Please try again.'
        : 'Something went wrong. Please try again.';
  }
}
