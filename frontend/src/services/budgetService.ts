import api from "./api";
import type { BudgetRequest, BudgetResponse, PageBudgetResponse } from "@/types";

// Budget API service functions matching the OpenAPI specification

export const getCurrentBudget = async (month?: string): Promise<BudgetResponse> => {
    const params = new URLSearchParams();
    if (month) {
        params.append("month", month);
    }
    const queryString = params.toString();
    const url = queryString ? `/budgets?${queryString}` : "/budgets";
    
    console.log('Budget service - requesting URL:', url);
    const response = await api.get(url);
    return response.data;
};

export const getDefaultBudget = async (): Promise<BudgetResponse> => {
    const response = await api.get("/budgets/default");
    return response.data;
};

export const setDefaultBudget = async (budgetData: BudgetRequest): Promise<BudgetResponse> => {
    const response = await api.post("/budgets/default", budgetData);
    return response.data;
};

export const getBudgetHistory = async (
    page: number = 0,
    size: number = 10
): Promise<PageBudgetResponse> => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });
    const response = await api.get(`/budgets/history?${params.toString()}`);
    return response.data;
};

export const getBudgetOverrides = async (
    page: number = 0,
    size: number = 10
): Promise<PageBudgetResponse> => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });
    const response = await api.get(`/budgets/overrides?${params.toString()}`);
    return response.data;
};

export const setMonthlyBudget = async (budgetData: BudgetRequest): Promise<BudgetResponse> => {
    const response = await api.post("/budgets/monthly", budgetData);
    return response.data;
};

export const deleteMonthlyBudget = async (month: string): Promise<void> => {
    await api.delete(`/budgets/monthly/${month}`);
};