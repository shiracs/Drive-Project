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
export const saveAuthData = (token, username) => {
    localStorage.setItem("userToken", token);
    localStorage.setItem("username", username);
};

/**
 * Utility to clear auth data on logout
 */
export const clearAuthData = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("username");
}