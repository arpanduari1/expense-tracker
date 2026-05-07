import api from "./api";
import axios from "axios";
import { tokenRefreshService } from "./tokenRefreshService";
import { performLogoutWithoutQuery } from "@/utils/logout";
import { setAuthToken, getAuthToken, setRefreshToken, getRefreshToken } from "@/utils/tokenStorage";
import type {
  ApiResponse,
  RegisterData,
  RegisterResponse,
  ResendOtpResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  OtpVerifyRequest,
  VerifyResponse,
  UserDto,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse
} from "@/types";

// Determine the API base URL (same logic as api.ts)
const envBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
const normalizedEnvBaseUrl = envBaseUrl ? envBaseUrl.replace(/\/$/, "") : "";
const authApiBaseUrl = import.meta.env.DEV ? "/api/v1" : normalizedEnvBaseUrl || "/api/v1";

// Login service
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post("/auth/login/web", credentials);
  const data = response.data;

  // Store access token
  const accessToken = data.accessToken ?? data.token;
  if (accessToken) {
    setAuthToken(accessToken);
  } else {
    console.warn('No accessToken in login response');
  }

  // Store refresh token
  if (data.refreshToken) {
    setRefreshToken(data.refreshToken);
  } else {
    console.warn('No refreshToken in login response');
  }

  // Start token monitoring after successful login
  const storedAuthToken = getAuthToken();
  if (storedAuthToken) {
    tokenRefreshService.startTokenMonitoring();
  }

  return data;
};

// Register service
export const register = async (
  userData: RegisterData
): Promise<RegisterResponse> => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

// Refresh token service - uses a clean axios instance to avoid interceptor interference.
// The main `api` instance attaches the (possibly expired) access token and has a 401
// interceptor that could trigger a cascading refresh-then-logout cycle.
export const refreshToken = async (): Promise<RefreshResponse> => {
  const storedRefreshToken = getRefreshToken();

  if (!storedRefreshToken) {
    throw new Error('No refresh token available');
  }

  const refreshUrl = `${authApiBaseUrl}/auth/refresh/web`;

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
  const data = response.data;

  // Update stored access token
  if (data.accessToken) {
    setAuthToken(data.accessToken);
  } else {
    console.warn('No accessToken in refresh response');
  }

  // Update stored refresh token
  if (data.refreshToken) {
    setRefreshToken(data.refreshToken);
  }

  // Restart token monitoring with new token
  const storedAuthToken = getAuthToken();
  if (storedAuthToken) {
    tokenRefreshService.startTokenMonitoring();
  }

  return data;
};

// Resend OTP for authentication
export const resendAuthOtp = async (email: string): Promise<ResendOtpResponse> => {
  const response = await api.post(`/auth/resend-otp?email=${encodeURIComponent(email)}`);
  return response.data;
};

// Verify authentication OTP
export const verifyAuth = async (data: any): Promise<any> => {
  const response = await api.post("/auth/verify", data);
  return response.data;
};

// Verify OTP using the correct API endpoint
export const verifyOtp = async (data: OtpVerifyRequest): Promise<VerifyResponse> => {
  const response = await api.post('/auth/verify', {
    token: data.token,
    otp: data.otp
  });
  return response.data;
};

// Resend OTP
export const resendOtp = async (data: { email: string }): Promise<ResendOtpResponse> => {
  const response = await api.post(`/auth/resend-otp?email=${encodeURIComponent(data.email)}`);
  return response.data;
};

// Get user details
export const getUser = async (): Promise<UserDto> => {
  const response = await api.get("/user");
  return response.data;
};

// Forgot password service
export const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

// Reset password service
export const resetPassword = async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
  const response = await api.post("/auth/reset-password", data);
  return response.data;
};

// Change password service
export const changePassword = async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
  const response = await api.patch("/auth/change-password", data);
  return response.data;
};

// Logout service - clears tokens and stops monitoring
export const logout = (): void => {
  performLogoutWithoutQuery();
};