import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, AlertCircle, PieChart, Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { format, parseISO } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/services/categoryService";
import { getCategoryWiseReport } from "@/services/reportService";
import type { CategoryResponse, CategoryRequest, CategoryWiseMonthlyExpenseResponse } from "@/types";

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryIcon, setEditCategoryIcon] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // New state for category breakdown
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().split('T')[0].slice(0, 7) + "-01"
  );
  const [userCurrency, setUserCurrency] = useState<string>(() => {
    return localStorage.getItem("userCurrency") || "USD";
  });

  const queryClient = useQueryClient();

  // Format currency helper
  const formatCurrency = useCallback(
    (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: userCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    },
    [userCurrency]
  );

  // Helper function to get category icon with fallback
  const getCategoryIcon = useCallback((categoryName: string, categoryIcon?: string): string => {
    if (!categoryName) return "💸";

    // Use the icon from the category-wise report if available
    if (categoryIcon) {
      return categoryIcon;
    }

    // Fallback based on category name
    const commonIcons: Record<string, string> = {
      "food": "🍕",
      "shopping": "🛍️",
      "transport": "🚗",
      "entertainment": "🎬",
      "health": "🏥",
      "utilities": "💡",
      "education": "📚",
      "travel": "✈️",
    };

    return commonIcons[categoryName.toLowerCase()] || "💸";
  }, []);

  // Note: Authentication is handled by SidebarLayout

  // Fetch categories
  const {
    data: categoriesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["categories", currentPage, pageSize],
    queryFn: () => getCategories(currentPage, pageSize),
    retry: 2,
  });

  // Fetch category-wise report
  const {
    data: categoryReport,
    isLoading: categoryLoading,
    error: categoryError,
    refetch: refetchCategory,
  } = useQuery<CategoryWiseMonthlyExpenseResponse>({
    queryKey: ["reports", "category-wise", selectedMonth],
    queryFn: () => getCategoryWiseReport(selectedMonth),
    retry: 1,
    enabled: !!localStorage.getItem("authToken"),
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: (categoryData: CategoryRequest) => createCategory(categoryData),
    onSuccess: () => {
      showSuccess("Category created successfully!");
      setIsCreateDialogOpen(false);
      setNewCategoryName("");
      setNewCategoryIcon("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      showError(error.response?.data?.message || "Failed to create category");
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryRequest }) =>
      updateCategory(id, data),
    onSuccess: () => {
      showSuccess("Category updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      setEditCategoryName("");
      setEditCategoryIcon("");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      showError(error.response?.data?.message || "Failed to update category");
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      showSuccess("Category deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      showError(error.response?.data?.message || "Failed to delete category");
    },
  });

  // Handle form submissions
  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      showError("Category name is required");
      return;
    }
    const categoryData: CategoryRequest = {
      name: newCategoryName.trim(),
    };
    if (newCategoryIcon.trim()) {
      categoryData.icon = newCategoryIcon.trim();
    }
    createMutation.mutate(categoryData);
  };

  const handleUpdateCategory = () => {
    if (!editCategoryName.trim() || !selectedCategory) {
      showError("Category name is required");
      return;
    }
    const categoryData: CategoryRequest = {
      name: editCategoryName.trim(),
    };
    if (editCategoryIcon.trim()) {
      categoryData.icon = editCategoryIcon.trim();
    }
    updateMutation.mutate({
      id: selectedCategory.id,
      data: categoryData,
    });
  };

  const handleDeleteCategory = () => {
    if (!selectedCategory) return;
    deleteMutation.mutate(selectedCategory.id);
  };

  // Handle edit button click
  const handleEditClick = (category: CategoryResponse) => {
    setSelectedCategory(category);
    setEditCategoryName(category.name);
    setEditCategoryIcon(category.icon || "");
    setIsEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (category: CategoryResponse) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Filter categories based on search term
  const filteredCategories = categoriesData?.content?.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Generate random colors for categories (since API doesn't provide colors)
  const getRandomColor = (id: number) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-yellow-100 text-yellow-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
      "bg-orange-100 text-orange-800",
      "bg-teal-100 text-teal-800",
    ];
    return colors[id % colors.length];
  };

  // Error handling component
  const ErrorMessage = ({ error, onRetry }: { error: Error; onRetry: () => void }) => (
    <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Failed to load data. Please try again.</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage your expense categories to organize your spending
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category to organize your expenses.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  placeholder="Enter category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-icon">Category Icon (Optional)</Label>
                <Input
                  id="category-icon"
                  placeholder="Enter an emoji (e.g., 🍕, 🚗, 🏠)"
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                  maxLength={2}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use default folder icon (💸)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category-wise Expense Breakdown */}
      <Card className="border-border bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Category-wise Expense Breakdown
          </CardTitle>
          <CardDescription>
            Detailed breakdown of expenses by category for {selectedMonth ? format(parseISO(selectedMonth), "MMMM yyyy") : "selected month"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Month Selector */}
          <div className="mb-6">
            <Label htmlFor="breakdown-month" className="text-sm font-medium">
              Select Month
            </Label>
            <div className="mt-1">
              <input
                id="breakdown-month"
                type="month"
                value={selectedMonth.slice(0, 7)}
                onChange={(e) => setSelectedMonth(e.target.value + "-01")}
                className="flex h-10 w-50 max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {categoryLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          ) : categoryError ? (
            <ErrorMessage error={categoryError} onRetry={refetchCategory} />
          ) : categoryReport?.categoryWiseExpenses?.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categoryReport.categoryWiseExpenses.map((category, index) => (
                <div key={index} className="p-4 border border-border rounded-lg bg-muted/20">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCategoryIcon(category.category, category.icon)}</span>
                      <span className="font-medium text-sm">{category.category}</span>
                    </div>
                    <Badge variant="secondary">{category.percentage.toFixed(1)}%</Badge>
                  </div>
                  <div className="text-xl font-bold text-foreground">{formatCurrency(category.amount)}</div>
                  <Progress value={category.percentage} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No category expense data available for this month</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try selecting a different month or start tracking your expenses.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
          <CardDescription>
            {categoriesData?.totalElements || 0} categories found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load categories. Please try again.
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => refetch()}
                  className="ml-2 h-auto p-0"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Categories Table */}
          {!isLoading && !error && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-full">Category</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        {searchTerm ? "No categories found matching your search." : "No categories found. Create your first category to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="w-full">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center text-lg">
                              {category.icon || "📂"}
                            </div>
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="w-32 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(category)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {categoriesData && categoriesData.totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {categoriesData.numberOfElements} of {categoriesData.totalElements} categories
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={categoriesData.first}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage + 1} of {categoriesData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={categoriesData.last}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Category Name</Label>
              <Input
                id="edit-category-name"
                placeholder="Enter category name"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleUpdateCategory();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-icon">Category Icon (Optional)</Label>
              <Input
                id="edit-category-icon"
                placeholder="Enter an emoji (e.g., 🍕, 🚗, 🏠)"
                value={editCategoryIcon}
                onChange={(e) => setEditCategoryIcon(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleUpdateCategory();
                  }
                }}
                maxLength={2}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default folder icon (💸)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Updating..." : "Update Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{selectedCategory?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Categories;