import api from "./api";
import type {
  YearlyReportResponse,
  TopExpenseResponse,
  MonthlyReportResponse,
  InsightResponse,
  CategoryWiseMonthlyExpenseResponse,
  DailyExpensesResponse,
} from "@/types";

// Report API service functions matching the OpenAPI specification

export const getYearlyReport = async (year?: number): Promise<YearlyReportResponse> => {
  const params = new URLSearchParams();
  if (year) {
    params.append("year", year.toString());
  }
  const queryString = params.toString();
  const url = queryString ? `/reports/yearly?${queryString}` : "/reports/yearly";
  
  const response = await api.get(url);
  return response.data;
};

export const getTopExpenses = async (month?: string, size: number = 5): Promise<TopExpenseResponse> => {
  const params = new URLSearchParams();
  if (month) {
    params.append("month", month);
  }
  params.append("size", size.toString());
  
  const response = await api.get(`/reports/top-expenses?${params.toString()}`);
  return response.data;
};

export const getMonthlyReport = async (month?: string): Promise<MonthlyReportResponse> => {
  const params = new URLSearchParams();
  if (month) {
    params.append("month", month);
  }
  const queryString = params.toString();
  const url = queryString ? `/reports/monthly?${queryString}` : "/reports/monthly";
  
  const response = await api.get(url);
  return response.data;
};

export const getInsights = async (month?: string): Promise<InsightResponse> => {
  const params = new URLSearchParams();
  if (month) {
    params.append("month", month);
  }
  const queryString = params.toString();
  const url = queryString ? `/reports/insights?${queryString}` : "/reports/insights";
  
  const response = await api.get(url);
  return response.data;
};

export const getCategoryWiseReport = async (month?: string): Promise<CategoryWiseMonthlyExpenseResponse> => {
  const params = new URLSearchParams();
  if (month) {
    params.append("month", month);
  }
  const queryString = params.toString();
  const url = queryString ? `/reports/category-wise?${queryString}` : "/reports/category-wise";
  
  const response = await api.get(url);
  return response.data;
};

export const getDailyExpensesByDate = async (month: string): Promise<DailyExpensesResponse> => {
  const response = await api.get(`/reports/daily-expenses?month=${month}`);
  return response.data;
};

// Export functions for PDF and Excel reports
export const exportYearlyReport = async (year?: number, type: 'PDF' | 'EXCEL' = 'PDF'): Promise<Blob> => {
  const params = new URLSearchParams();
  if (year) {
    params.append("year", year.toString());
  }
  params.append("type", type);
  
  const response = await api.get(`/reports/yearly/export?${params.toString()}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const exportMonthlyReport = async (month?: string, type: 'PDF' | 'EXCEL' = 'PDF'): Promise<Blob> => {
  const params = new URLSearchParams();
  if (month) {
    params.append("month", month);
  }
  params.append("type", type);
  
  const response = await api.get(`/reports/monthly/export?${params.toString()}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const exportCustomReport = async (startDate: string, endDate: string, type: 'PDF' | 'EXCEL' = 'PDF'): Promise<Blob> => {
  const params = new URLSearchParams();
  params.append("startDate", startDate);
  params.append("endDate", endDate);
  params.append("type", type);
  
  const response = await api.get(`/reports/custom/export?${params.toString()}`, {
    responseType: 'blob',
  });
  return response.data;
};
