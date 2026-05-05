// Utility functions for JWT token handling

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true; // Treat invalid tokens as expired
  }
};

export const getTokenExpiration = (token: string): Date | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

export const getTokenPayload = (token: string): any => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

export const logTokenInfo = (token: string, tokenType: string = 'token') => {
  const payload = getTokenPayload(token);
  const expiration = getTokenExpiration(token);
  const isExpired = isTokenExpired(token);
  
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.log(`${tokenType} info:`, {
      isExpired,
      expiration: expiration?.toISOString(),
      payload: payload ? {
        username: payload.username,
        userId: payload.userId,
        iat: new Date(payload.iat * 1000).toISOString(),
        exp: new Date(payload.exp * 1000).toISOString()
      } : null
    });
  }
  
  return { isExpired, expiration, payload };
};

// Check if token will expire within the next 5 minutes (300 seconds)
export const isTokenExpiringSoon = (token: string, bufferSeconds: number = 300): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp <= (currentTime + bufferSeconds);
  } catch (error) {
    console.error('Error parsing token:', error);
    return true; // Treat invalid tokens as expiring soon
  }
};

// Get time remaining until token expires (in seconds)
export const getTokenTimeRemaining = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - currentTime);
  } catch (error) {
    console.error('Error parsing token:', error);
    return 0;
  }
};
