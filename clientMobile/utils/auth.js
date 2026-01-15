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
  await AsyncStorage.setItem("userToken", token);
  await AsyncStorage.setItem("username", username);
  await AsyncStorage.setItem("userId", userId);
  await AsyncStorage.setItem("profilePic", profilePic);
};

/**
 * Utility to clear auth data on logout
 */
export const clearAuthData = async () => {
  await AsyncStorage.removeItem("userToken");
  await AsyncStorage.removeItem("username");
  await AsyncStorage.removeItem("userId");
  await AsyncStorage.removeItem("profilePic");
};

/**
 * Utility to get auth data
 */
export const getAuthData = async () => {
  const token = await AsyncStorage.getItem("userToken");
  const username = await AsyncStorage.getItem("username");
  const userId = await AsyncStorage.getItem("userId");
  const profilePic = await AsyncStorage.getItem("profilePic");
  
  return { token, username, userId, profilePic };
};
