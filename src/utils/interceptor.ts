import { apiCall } from '../api/base';

// Interceptor global para manejar sesiones expiradas
const originalApiCall = apiCall;

export const setupInterceptor = (onUnauthorized: () => void) => {
  (window as any).apiCall = async (...args: Parameters<typeof apiCall>) => {
    try {
      return await originalApiCall(...args);
    } catch (error: any) {
      if (error.status === 401) {
        onUnauthorized();
      }
      throw error;
    }
  };
};