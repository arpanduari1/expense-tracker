import { isTokenExpiringSoon, getTokenTimeRemaining } from "@/utils/tokenUtils";
import { refreshToken } from "@/services/authService";
import { getAuthToken, getRefreshToken } from "@/utils/tokenStorage";

class TokenRefreshService {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  /**
   * Start monitoring the access token and refresh it proactively
   */
  public startTokenMonitoring() {
    this.stopTokenMonitoring(); // Clear any existing timer
    this.scheduleTokenRefresh();
  }

  /**
   * Stop monitoring the access token
   */
  public stopTokenMonitoring() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Schedule the next token refresh based on the current token's expiration
   */
  private scheduleTokenRefresh() {
    const token = getAuthToken();
    if (!token) {
      // No access token, try to refresh using refresh token
      const storedRefreshToken = getRefreshToken();
      if (storedRefreshToken) {
        this.performTokenRefresh();
      }
      return;
    }

    try {
      const timeRemaining = getTokenTimeRemaining(token);

      if (timeRemaining <= 0) {
        this.performTokenRefresh();
        return;
      }

      // Schedule refresh 5 minutes before expiration, but at least 1 minute after now
      const refreshInSeconds = Math.max(60, timeRemaining - 300); // 5 minutes buffer, minimum 1 minute
      const refreshInMs = refreshInSeconds * 1000;

      this.refreshTimer = setTimeout(() => {
        this.performTokenRefresh();
      }, refreshInMs);
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh() {
    if (this.isRefreshing) {
      return;
    }

    // Check if we have a refresh token to use
    const storedRefreshToken = getRefreshToken();
    if (!storedRefreshToken) {
      console.log('No refresh token available for refresh');
      return;
    }

    const token = getAuthToken();
    // Only check expiration if we have an access token
    if (token && !isTokenExpiringSoon(token, 300)) {
      this.scheduleTokenRefresh();
      return;
    }

    try {
      this.isRefreshing = true;

      await refreshToken();

      // Schedule the next refresh
      this.scheduleTokenRefresh();
    } catch (error) {
      console.error('Proactive token refresh failed:', error);
      // On failure, try again in 1 minute
      this.refreshTimer = setTimeout(() => {
        this.performTokenRefresh();
      }, 60000);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Check if the current token needs refreshing and do it if necessary.
   * Returns true if we have a valid token (or successfully refreshed), false otherwise.
   */
  public async checkAndRefreshIfNeeded(): Promise<boolean> {
    const token = getAuthToken();
    const storedRefreshToken = getRefreshToken();

    // If no access token but we have a refresh token, try to refresh
    if (!token && storedRefreshToken) {
      try {
        console.log('No access token, attempting refresh with stored refresh token');
        await refreshToken();
        return true;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
      }
    }

    // No tokens at all
    if (!token) {
      return false;
    }

    // If token is expiring soon, refresh it
    if (isTokenExpiringSoon(token, 60)) { // 1 minute buffer for immediate check
      try {
        await refreshToken();
        return true;
      } catch (error) {
        return false;
      }
    }

    return true; // Token is still valid
  }
}

// Export a singleton instance
export const tokenRefreshService = new TokenRefreshService();