import { clearAuthData, getTokenHeader } from './auth';

/**
 * Wrapper for fetch that automatically handles 401/403 responses
 * If the server returns 401 or 403, it clears auth data and redirects to login
 */
export const fetchWithAuth = async (url, options = {}) => {
  const auth = getTokenHeader();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...auth,
      ...options.headers,
    },
  });

  // If unauthorized, clear auth and redirect to login
  if (response.status === 401 || response.status === 403) {
    clearAuthData();
    window.location.href = '/login';
    throw new Error('Unauthorized - redirecting to login');
  }

  return response;
};
