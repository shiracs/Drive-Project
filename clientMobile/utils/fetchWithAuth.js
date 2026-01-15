import { clearAuthData, getTokenHeader } from './auth';
import * as Router from 'expo-router';

/**
 * Wrapper for fetch that automatically handles 401/403 responses
 * If the server returns 401 or 403, it clears auth data and redirects to login
 */
export const fetchWithAuth = async (url, options = {}) => {
  const auth = await getTokenHeader();
  
  console.log("fetchWithAuth - Auth header:", auth);
  
  if (!auth.Authorization) {
    console.warn("No token available");
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

    console.log(`fetchWithAuth - Response status: ${response.status} for URL: ${url}`);

    if (response.status === 401 || response.status === 403) {
      console.warn("Unauthorized response, clearing auth data");
      await clearAuthData();
      setTimeout(() => {
        Router.router.replace('/login');
      }, 100);
      throw new Error('Unauthorized - redirecting to login');
    }

    return response;
    
  } catch (error) {
    console.error("fetchWithAuth error:", error);
    if (error.message === 'Unauthorized - redirecting to login') {
      throw error;
    }
    throw error;
  }
};
