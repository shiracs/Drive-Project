import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utility to get the auth token header
 */
export const getTokenHeader = async () => {
  const token = await AsyncStorage.getItem("userToken");
  if (!token) return {};
  return { "Authorization": `Bearer ${token}` };
};

/**
 * Utility to save auth data
 */
export const saveAuthData = async (token, username, userId, profilePic) => {
  try {
    await AsyncStorage.setItem("userToken", String(token || ""));
    await AsyncStorage.setItem("username", String(username || ""));
    await AsyncStorage.setItem("userId", String(userId || ""));
    await AsyncStorage.setItem("profilePic", String(profilePic || ""));
  } catch (error) {
    console.error("Error saving auth data:", error);
  }
};

/**
 * Utility to clear auth data on logout
 */
export const clearAuthData = async () => {
  try {
    const keys = ["userToken", "username", "userId", "profilePic"];
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

/**
 * Utility to get auth data
 */
export const getAuthData = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const username = await AsyncStorage.getItem("username");
    const userId = await AsyncStorage.getItem("userId");
    const profilePic = await AsyncStorage.getItem("profilePic");
    
    return { token, username, userId, profilePic };
  } catch (error) {
    console.error("Error getting auth data:", error);
    return { token: null, username: null, userId: null, profilePic: null };
  }
};