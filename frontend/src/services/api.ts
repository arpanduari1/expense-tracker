import axios from "axios";
import { performLogoutWithoutQuery } from "@/utils/logout";
import { getAuthToken, setAuthToken, clearAuthToken, clearRefreshToken, getRefreshToken, setRefreshToken } from "@/utils/tokenStorage";

const envBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
const normalizedEnvBaseUrl = envBaseUrl ? envBaseUrl.replace(/\/$/, "") : "";
const apiBaseUrl = import.meta.env.DEV ? "/api/v1" : normalizedEnvBaseUrl || "/api/v1";

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});

// Token refresh state management to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });

  failedQueue = [];
};

// Token refresh function
const refreshAuthToken = async (): Promise<string | null> => {
  // If already refreshing, add to queue
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  try {
    const rawBaseUrl = api.defaults.baseURL || apiBaseUrl;
    const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, "");
    const refreshUrl = `${normalizedBaseUrl}/auth/refresh/web`;

    // Get refresh token from localStorage
    const storedRefreshToken = getRefreshToken();
    if (!storedRefreshToken) {
      console.error('No refresh token available for token refresh');
      return null;
    }

    isRefreshing = true;

    // Use a clean axios instance to avoid interceptors and infinite loops
    const response = await axios.post(
      refreshUrl,
      { refreshToken: storedRefreshToken },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        timeout: 10000,
        withCredentials: true,
      }
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    if (!accessToken) {
      throw new Error('No access token in refresh response');
    }

    // Store new access token
    setAuthToken(accessToken);

    // Store new refresh token if provided
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken);
    }

    // Process queued requests with new token
    processQueue(null, accessToken);

    return accessToken;
  } catch (error: any) {
    console.error('Token refresh failed:', error.response?.data || error.message);

    // Process queued requests with error
    processQueue(error, null);

    // Use centralized logout utility
    if (!window.location.pathname.includes('/login')) {
      performLogoutWithoutQuery();
    }
    clearAuthToken();
    clearRefreshToken();

    return null;
  } finally {
    isRefreshing = false;
  }
};

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      // Set token with Bearer prefix for authentication
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => {
    // Check for new access token in response headers (if backend sends updated tokens)
    const newToken = response.headers['authorization'] || response.headers['Authorization'];
    if (newToken && newToken.startsWith('Bearer ')) {
      const token = newToken.replace('Bearer ', '');
      setAuthToken(token);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAuthToken();
        if (newToken) {
          // Update the authorization header with the new token (with Bearer prefix)
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed during 401 handling:', refreshError);
        // The refreshAuthToken function already handles cleanup and redirect
        return Promise.reject(refreshError);
      }
    }

    // Log API errors for debugging
    console.error('API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data
    });

    // Check for network errors
    if (!error.response) {
      console.error('Network Error - Server might be down or CORS issue');
    }

    return Promise.reject(error);
  }
);

export default api;