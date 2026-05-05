// Utility to manage avatar refresh globally
class AvatarRefreshManager {
  private listeners: Set<() => void> = new Set();
  private refreshTimestamp: number = Date.now();

  // Subscribe to avatar refresh events
  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Trigger avatar refresh across all components
  triggerRefresh() {
    this.refreshTimestamp = Date.now();
    this.listeners.forEach(callback => callback());
  }

  // Get current refresh timestamp
  getRefreshTimestamp() {
    return this.refreshTimestamp;
  }
}

export const avatarRefreshManager = new AvatarRefreshManager();