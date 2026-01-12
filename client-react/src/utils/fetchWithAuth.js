import { clearAuthData, getTokenHeader } from './auth';

/**
 * Wrapper for fetch that automatically handles 401/403 responses
 * If the server returns 401 or 403, it clears auth data and redirects to login
 */
export const fetchWithAuth = async (url, options = {}) => {
  const auth = getTokenHeader();
  
  if (!auth.Authorization) {
    throw new Error('No token available');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...auth,
        ...options.headers,
      },
    });

    if (response.status === 401 || response.status === 403) {
      clearAuthData();
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      throw new Error('Unauthorized - redirecting to login');
    }

    return response;
    
  } catch (error) {
    if (error.message === 'Unauthorized - redirecting to login') {
      throw error;
    }
    throw error;
  }
};
