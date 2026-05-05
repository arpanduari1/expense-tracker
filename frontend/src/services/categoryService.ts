import api from "./api";
import type { CategoryRequest, CategoryResponse, PageCategoryResponse } from "@/types";

// Get categories with pagination
export const getCategories = async (page: number = 0, size: number = 10): Promise<PageCategoryResponse> => {
  const response = await api.get(`/categories?page=${page}&size=${size}`);
  return response.data;
};

// Create a new category
export const createCategory = async (categoryData: CategoryRequest): Promise<CategoryResponse> => {
  const response = await api.post("/categories", categoryData);
  return response.data;
};

// Update an existing category
export const updateCategory = async (id: number, categoryData: CategoryRequest): Promise<CategoryResponse> => {
  const response = await api.put(`/categories/${id}`, categoryData);
  return response.data;
};

// Delete a category
export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/categories/${id}`);
};