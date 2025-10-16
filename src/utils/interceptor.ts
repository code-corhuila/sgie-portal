import { onUnauthorized, type ApiError } from '../api/base';

export const setupInterceptor = (onUnauthorizedCallback: () => void) =>
  onUnauthorized((error: ApiError) => {
    if (error.status === 401) {
      onUnauthorizedCallback();
    }
  });
