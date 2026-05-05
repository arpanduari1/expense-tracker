import { getTokenExpiration } from "@/utils/tokenUtils";

const AUTH_TOKEN_KEY = "authToken";
const REFRESH_TOKEN_KEY = "refreshToken";

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

export const setAuthToken = (token: string) => {
  if (!token || !isBrowser) {
    return;
  }

  try {
    const expiration = getTokenExpiration(token);
    if (expiration) {
      const remainingMs = expiration.getTime() - Date.now();
      if (remainingMs <= 0) {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        return;
      }
    }

    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to persist auth token:", error);
  }
};

export const getAuthToken = (): string | null => {
  if (!isBrowser) {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
};

export const clearAuthToken = () => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const setRefreshToken = (token: string) => {
  if (!token || !isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to persist refresh token:", error);
  }
};

export const getRefreshToken = (): string | null => {
  if (!isBrowser) {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearRefreshToken = () => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
};

