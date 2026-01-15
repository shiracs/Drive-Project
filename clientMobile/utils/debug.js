import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../consts/Urls';
import { getTokenHeader } from './auth';

/**
 * Debug authentication status
 */
export const debugAuthStatus = async () => {
  console.log("\n=== AUTH DEBUG ===");
  
  try {
    const token = await AsyncStorage.getItem('userToken');
    const username = await AsyncStorage.getItem('username');
    const userId = await AsyncStorage.getItem('userId');
    
    console.log("Token stored:", token ? `YES (${token.substring(0, 20)}...)` : "NO");
    console.log("Username stored:", username || "NO");
    console.log("UserId stored:", userId || "NO");
    
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const decoded = JSON.parse(atob(parts[1]));
          console.log("Token payload:", decoded);
        } catch (e) {
          console.log("Could not decode token payload");
        }
      }
    }
    
    return { token, username, userId };
  } catch (error) {
    console.error("Debug error:", error);
  }
};

/**
 * Test if API is accessible
 */
export const testAPIConnection = async () => {
  console.log("\n=== API CONNECTION TEST ===");
  console.log("Testing URL:", `${API_BASE_URL}/files`);
  
  try {
    const auth = await getTokenHeader();
    console.log("Authorization header:", auth.Authorization ? "YES" : "NO");
    
    const response = await fetch(`${API_BASE_URL}/files`, {
      method: 'GET',
      headers: {
        ...auth,
        'Content-Type': 'application/json',
      },
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log("Error response:", errorText);
    }
    
    return response.status;
  } catch (error) {
    console.error("API test error:", error);
    return null;
  }
};

/**
 * Clear all auth and reset to login
 */
export const resetAuth = async () => {
  console.log("\n=== RESETTING AUTH ===");
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('username');
  await AsyncStorage.removeItem('userId');
  await AsyncStorage.removeItem('profilePic');
  console.log("Auth cleared");
};
