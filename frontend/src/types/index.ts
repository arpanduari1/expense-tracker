// This file will be used for shared TypeScript types across the application.

// Generic API response structure
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Error Response structure (based on API documentation)
export interface ErrorResponse {
  apiPath: string;
  statusCode: number;
  status: string;
  errorMessage: string;
  timestamp: string;
}

// Validation Error Response (for field-specific errors)
export interface ValidationErrorResponse {
  field: string;
  message: string;
}

export interface ValidationErrorsResponse {
  errors: ValidationErrorResponse[];
  message?: string;
}

// Pagination types
export interface PageableObject {
  offset: number;
  sort: SortObject;
  unpaged: boolean;
  paged: boolean;
  pageNumber: number;
  pageSize: number;
}

export interface SortObject {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface PageResponse<T> {
  totalPages: number;
  totalElements: number;
  size: number;
  content: T[];
  number: number;
  sort: SortObject;
  numberOfElements: number;
  pageable: PageableObject;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Auth Types
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  currency: string;
}

// User Data Transfer Object
export interface UserDto {
  username: string;
  email: string;
  currency: string;
  avatarUrl?: string;
}

export interface RegisterResponse {
  message: string;
  verificationToken: string;
}

export interface ResendOtpResponse {
  message: string;
  verificationUrl: string;
}

export interface LoginRequest {
  userIdentifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  id: number;
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
  passwordChanged: boolean;
}

// OTP Verification Types (based on API documentation)
export interface OtpVerifyRequest {
  token: string;
  otp: string;
}

export interface VerifyResponse {
  message: string;
  status: string;
}

// Category Types (based on API documentation)
export interface CategoryRequest {
  name: string;
  icon?: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  icon?: string;
}

export type PageCategoryResponse = PageResponse<CategoryResponse>;

// Legacy Category Type (for backwards compatibility)
export interface Category {
  id: string;
  name: string;
  color: string;
}

// Payment Method enum based on API documentation
export enum PaymentMethod {
  UPI = "UPI",
  CASH = "CASH",
  CARD = "CARD",
  OTHER = "OTHER"
}

// Expense Types (based on API documentation)
export interface ExpenseRequest {
  amount: number;
  expenseName: string; // Required field for expense name
  categoryId: number;
  description?: string; // Optional description
  paymentMethod: PaymentMethod; // Required payment method
  createdDate?: string; // Optional date in ISO format (YYYY-MM-DD)
  createdTime?: {
    hour: number;
    minute: number;
    second: number;
    nano?: number;
  }; // Optional time object
}

export interface ExpenseResponse {
  id: number;
  expenseName: string; // Expense name in response
  amount: number;
  categoryName: string;
  description: string;
  paymentMethod: PaymentMethod; // Payment method in response
  createdDate: string;
  createdTime: {
    hour: number;
    minute: number;
    second: number;
    nano: number;
  } | string; // Support both object and string formats
}

export interface ExpenseUpdateRequest {
  amount?: number;
  expenseName?: string;
  description?: string;
  categoryId?: number;
  paymentMethod?: PaymentMethod;
  createdDate?: string;
  createdTime?: {
    hour: number;
    minute: number;
    second: number;
    nano?: number;
  };
}

export type PageExpenseResponse = PageResponse<ExpenseResponse>;

// Legacy Expense Type (for backwards compatibility)
export interface Expense {
  id: string;
  date: string;
  categoryId: string;
  description: string;
  amount: number;
}

// Budget Types (based on API documentation)
export interface BudgetRequest {
  amount: number;
  month?: string; // Optional - ISO date format (YYYY-MM-DD)
}

export interface BudgetResponse {
  id: number;
  amount: number;
  month: string; // ISO date format
  default: boolean;
}

export type PageBudgetResponse = PageResponse<BudgetResponse>;

// Legacy Budget Type (for backwards compatibility)
export interface Budget {
  id: string;
  month: string;
  year: number;
  amount: number;
  spent: number;
}

// Report Types (based on API documentation)
export interface MonthlyYearResponse {
  budget: number;
  totalExpenses: number;
  netSavings: number;
}

export interface YearlyReportResponse {
  year: number;
  monthlyReports: Record<string, MonthlyYearResponse>;
}

export interface CategoryWiseTopExpense {
  category: string;
  amount: number;
  percentage: number;
}

export interface TopExpenseResponse {
  month: string;
  year: number;
  topExpenses: CategoryWiseTopExpense[];
}

export interface MonthlyReportResponse {
  month: string;
  budget: number;
  totalExpenses: number;
  netSavings: number;
}

export interface InsightResponse {
  month: string;
  year: number;
  mostExpensiveDay: string;
  amountOnMostExpensiveDay: number;
  averageDailySpending: number;
  expensiveCategory: string;
  expensiveCategorySpending: number;
  totalSpending: number;
}

export interface CategoryExpenseResponse {
  category: string;
  amount: number;
  percentage: number;
  icon?: string;
}

export interface CategoryWiseMonthlyExpenseResponse {
  month: string;
  categoryWiseExpenses: CategoryExpenseResponse[];
}

// Daily Expense Response for Calendar View
export interface DailyExpenseResponse {
  id?: number;
  expenseName?: string;
  amount: number;
  category: string;
  description: string;
  paymentMethod?: PaymentMethod;
  createdDate: string;
  createdAtTime?: string | {
    hour?: number;
    minute?: number;
    second?: number;
    nano?: number;
  };
}

export interface DailyExpensesResponse {
  [date: string]: DailyExpenseResponse[];
}

// Profile Related Types
export interface ProfilePictureUploadResponse {
  profilePictureUrl: string;
  message: string;
}

export interface ProfilePictureDeleteResponse {
  deleted: boolean;
  message: string;
}

// Ledger Types (based on API documentation)
export interface LedgerUserRequest {
  name: string;
  email: string;
}

export interface LedgerUserResponse {
  id: number;
  name: string;
  email?: string;
  balance: number;
  youGave: number;
  youGot: number;
}

// Actual API response structure for /ledger/contacts
export interface LedgerContactSummary {
  id: number;
  name: string;
  email?: string;
  totalAmount: number;
  lastUpdated: string;
}

export interface LedgerEntryRequest {
  ledgerUserId: number;
  amount: number;
  description?: string;
  type: 'CREDIT' | 'DEBIT';
  createdDate?: string; // ISO date-time format
}

export interface LedgerEntryResponse {
  id: number;
  amount: number;
  description?: string;
  type: 'CREDIT' | 'DEBIT';
  createdDate: string;
}

export interface LedgerUserEntryResponse {
  id: number;
  name: string;
  email?: string;
  balance: number;
  youGave: number;
  youGot: number;
  entries: LedgerEntryResponse[];
}

export type PageLedgerUserResponse = PageResponse<LedgerUserResponse>;
export type PageLedgerEntryResponse = PageResponse<LedgerEntryResponse>;