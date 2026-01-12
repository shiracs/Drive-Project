/**
 * Utility to format and retrieve the auth token
 */
export const getTokenHeader = () => {
    const token = localStorage.getItem("userToken");
    if (!token) return {};
    return { "Authorization": `Bearer ${token}` };
};

/**
 * Utility to save token correctly
 */
export const saveAuthData = (token, username, userId, profilePic) => {
    localStorage.setItem("userToken", token);
    localStorage.setItem("username", username);
    localStorage.setItem("userId", userId);
    localStorage.setItem("profilePic", profilePic);
};

/**
 * Utility to clear auth data on logout
 */
export const clearAuthData = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("profilePic");
}