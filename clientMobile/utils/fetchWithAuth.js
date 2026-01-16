import { getTokenHeader } from "./auth";
import {router } from "expo-router";
import { Alert } from "react-native";

export const fetchWithAuth = async (url, options = {}) => {
  try {
    const authHeaders = await getTokenHeader();

    const headers = {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      {
        console.log("unauthorized - fetch with auth");
        clearAuthData();
        router.replace("/");
      }
      return response;
    }
    return response;
  } catch (error) {
    console.error("FetchWithAuth error:", error);
    throw error;
  }
};
