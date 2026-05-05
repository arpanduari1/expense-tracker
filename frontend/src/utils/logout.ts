import { QueryClient } from "@tanstack/react-query";
import { tokenRefreshService } from "@/services/tokenRefreshService";
import { clearAuthToken, clearRefreshToken } from "@/utils/tokenStorage";

/**
 * Centralized logout utility to ensure proper cleanup
 * @param queryClient - TanStack Query client instance
 * @param navigate - React Router navigate function (optional)
 */
export const performLogout = (queryClient: QueryClient, navigate?: (path: string, options?: any) => void) => {
  // Stop token monitoring
  tokenRefreshService.stopTokenMonitoring();
  
  // Clear all cached data to prevent data leakage between users
  queryClient.clear();
  
  // Clear auth and refresh tokens
  clearAuthToken();
  clearRefreshToken();
  
  // Clear any other user-specific data from localStorage
  localStorage.removeItem('userCurrency');
  localStorage.removeItem('hasOnboarded');
  
  // Navigate to login if navigate function is provided
  if (navigate) {
    navigate('/login', { replace: true });
  }
};

/**
 * Logout utility for when queryClient is not available
 * @param navigate - React Router navigate function (optional)
 */
export const performLogoutWithoutQuery = (navigate?: (path: string, options?: any) => void) => {
  // Stop token monitoring
  tokenRefreshService.stopTokenMonitoring();
  
  // Clear auth and refresh tokens
  clearAuthToken();
  clearRefreshToken();
  
  // Clear any other user-specific data from localStorage
  localStorage.removeItem('userCurrency');
  localStorage.removeItem('hasOnboarded');
  
  // Navigate to login if navigate function is provided
  if (navigate) {
    navigate('/login', { replace: true });
  }
};