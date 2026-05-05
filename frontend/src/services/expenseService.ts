import api from "./api";
import type { ExpenseRequest, ExpenseResponse, PageExpenseResponse, ExpenseUpdateRequest } from "@/types";

// Expense API service functions matching the OpenAPI specification

export const getExpenses = async (
  page: number = 0,
  size: number = 10,
  sortBy: string = "createdDate",
  direction: string = "desc",
  startDate?: string,
  endDate?: string,
  categoryId?: number
): Promise<PageExpenseResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sortBy,
    direction,
  });

  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (categoryId) params.append("categoryId", categoryId.toString());

  const response = await api.get(`/expenses?${params.toString()}`);
  console.log('Raw API response for expenses:', response.data);
  return response.data;
};

export const getExpenseById = async (id: number): Promise<ExpenseResponse> => {
  const response = await api.get(`/expenses/${id}`);
  return response.data;
};

export const createExpense = async (expenseData: ExpenseRequest): Promise<ExpenseResponse> => {
  // Build cleaned data with required fields
  const cleanedData: any = {
    amount: expenseData.amount,
    expenseName: expenseData.expenseName, // Required field
    categoryId: expenseData.categoryId,
    paymentMethod: expenseData.paymentMethod // Required field
  };

  // Add optional description if provided
  if (expenseData.description && expenseData.description.trim() !== '') {
    cleanedData.description = expenseData.description;
  }

  // Only include date fields if they have valid values
  if (expenseData.createdDate && expenseData.createdDate.trim() !== '') {
    cleanedData.createdDate = expenseData.createdDate;
  }

  // Convert createdTime object to string format if provided
  if (expenseData.createdTime && 
      (expenseData.createdTime.hour !== 0 || 
       expenseData.createdTime.minute !== 0 || 
       expenseData.createdTime.second !== 0)) {
    const { hour, minute, second, nano = 0 } = expenseData.createdTime;
    // Format as HH:mm:ss.nnnnnnn to match Postman format
    // Use current seconds if not provided (for user-selected time)
    const actualSecond = second || new Date().getSeconds();
    const actualNano = nano || new Date().getMilliseconds() * 1000000; // Convert ms to nanoseconds
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${actualSecond.toString().padStart(2, '0')}.${actualNano.toString().padStart(6, '0')}`;
    cleanedData.createdTime = timeString;
  }

  console.log('Creating expense with data:', cleanedData);
  const response = await api.post("/expenses", cleanedData);
  return response.data;
};

export const updateExpense = async (id: number, expenseData: ExpenseUpdateRequest): Promise<ExpenseResponse> => {
  // Build cleaned data with only provided fields
  const cleanedData: any = {};

  // Add fields only if they are provided
  if (expenseData.amount !== undefined) {
    cleanedData.amount = expenseData.amount;
  }
  
  if (expenseData.expenseName && expenseData.expenseName.trim() !== '') {
    cleanedData.expenseName = expenseData.expenseName;
  }
  
  if (expenseData.categoryId !== undefined) {
    cleanedData.categoryId = expenseData.categoryId;
  }
  
  if (expenseData.paymentMethod) {
    cleanedData.paymentMethod = expenseData.paymentMethod;
  }
  
  if (expenseData.description !== undefined) {
    cleanedData.description = expenseData.description;
  }

  // Only include date fields if they have valid values
  if (expenseData.createdDate && expenseData.createdDate.trim() !== '') {
    cleanedData.createdDate = expenseData.createdDate;
  }

  // Convert createdTime object to string format if provided
  if (expenseData.createdTime && 
      (expenseData.createdTime.hour !== 0 || 
       expenseData.createdTime.minute !== 0 || 
       expenseData.createdTime.second !== 0)) {
    const { hour, minute, second, nano = 0 } = expenseData.createdTime;
    // Format as HH:mm:ss.nnnnnnn to match Postman format
    // Use current seconds if not provided (for user-selected time)
    const actualSecond = second || new Date().getSeconds();
    const actualNano = nano || new Date().getMilliseconds() * 1000000; // Convert ms to nanoseconds
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${actualSecond.toString().padStart(2, '0')}.${actualNano.toString().padStart(6, '0')}`;
    cleanedData.createdTime = timeString;
  }

  console.log('Updating expense with data:', cleanedData);
  const response = await api.patch(`/expenses/${id}`, cleanedData);
  return response.data;
};

export const deleteExpense = async (id: number): Promise<void> => {
  await api.delete(`/expenses/${id}`);
};