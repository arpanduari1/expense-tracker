import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, Filter, Calendar as CalendarIcon, DollarSign, AlertCircle, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, X } from "lucide-react";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { showSuccess, showError } from "@/utils/toast";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense
} from "@/services/expenseService";
import { getCategories } from "@/services/categoryService";
import { getUser } from "@/services/userService";
import type { ExpenseRequest, ExpenseResponse, CategoryResponse, PageExpenseResponse, PageCategoryResponse, ExpenseUpdateRequest } from "@/types";
import { PaymentMethod } from "@/types";
import { cn } from "@/lib/utils";

const Expenses = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseResponse | null>(null);
  // User currency state
  const [userCurrency, setUserCurrency] = useState<string>(() => {
    // Initialize with stored currency or default to INR
    return localStorage.getItem('userCurrency') || 'INR';
  });

  // Form state
  const [formData, setFormData] = useState<ExpenseRequest>({
    amount: 0,
    expenseName: "", // Required field
    categoryId: 0,
    description: "",
    paymentMethod: PaymentMethod.CASH, // Required field with default
    createdDate: format(new Date(), 'yyyy-MM-dd'), // Default to today
    createdTime: {
      hour: new Date().getHours(),
      minute: new Date().getMinutes(),
      second: new Date().getSeconds(),
      nano: 0
    }
  });

  // Date selection state for form
  const [selectedFormDate, setSelectedFormDate] = useState<Date>(new Date());

  // Filter and pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isRefreshingCategories, setIsRefreshingCategories] = useState(false);
  const [lastCategoryFetch, setLastCategoryFetch] = useState<number>(0);

  const queryClient = useQueryClient();

  // Debounce search term to improve performance
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // User data fetch for currency (authentication is handled by SidebarLayout)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching user data for currency...');
        const userData = await getUser();
        console.log('User data fetched:', userData);
        if (userData && userData.currency) {
          setUserCurrency(userData.currency);
          localStorage.setItem('userCurrency', userData.currency);
          console.log('User currency set to:', userData.currency);
        } else {
          console.log('No currency found in user data, using stored or default');
          // Keep current userCurrency (which defaults to stored or INR)
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to stored currency or default (already set in state initialization)
        console.log('Using fallback currency:', userCurrency);
      }
    };

    fetchUserData();
  }, []);

  // Fetch expenses with filters (searchTerm removed from API query - handled client-side)
  const {
    data: expensesData,
    isLoading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses
  } = useQuery<PageExpenseResponse>({
    queryKey: [
      "expenses",
      currentPage,
      pageSize,
      sortBy,
      sortDirection,
      selectedCategoryId,
      startDate?.toISOString().split('T')[0],
      endDate?.toISOString().split('T')[0]
    ],
    queryFn: () => getExpenses(
      currentPage,
      pageSize,
      sortBy,
      sortDirection,
      startDate?.toISOString().split('T')[0],
      endDate?.toISOString().split('T')[0],
      selectedCategoryId
    ),
    retry: 2,
  });

  // Fetch categories for dropdown
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useQuery<PageCategoryResponse>({
    queryKey: ["categories"],
    queryFn: () => getCategories(0, 50), // Get more categories for dropdown
    retry: 2,
  });

  // Function to refresh categories when dropdown is opened
  const handleCategoryDropdownOpen = useCallback(async () => {
    if (isRefreshingCategories) {
      console.log('Categories are already being refreshed, skipping...');
      return;
    }

    // Avoid fetching if we just fetched within the last 30 seconds
    const now = Date.now();
    const timeSinceLastFetch = now - lastCategoryFetch;
    const FETCH_COOLDOWN = 30000; // 30 seconds

    if (timeSinceLastFetch < FETCH_COOLDOWN) {
      console.log(`Categories were fetched ${timeSinceLastFetch}ms ago, skipping refresh (cooldown: ${FETCH_COOLDOWN}ms)`);
      return;
    }

    console.log('Category dropdown opened, fetching latest categories...');
    setIsRefreshingCategories(true);
    try {
      const startTime = Date.now();
      await refetchCategories();
      const endTime = Date.now();
      setLastCategoryFetch(endTime);
      console.log(`Categories refreshed successfully in ${endTime - startTime}ms`);
    } catch (error) {
      console.error('Failed to refresh categories:', error);
      showError('Failed to load latest categories');
    } finally {
      setIsRefreshingCategories(false);
    }
  }, [refetchCategories, isRefreshingCategories, lastCategoryFetch]);

  // Create expense mutation
  const createMutation = useMutation({
    mutationFn: (expenseData: ExpenseRequest) => createExpense(expenseData),
    onSuccess: () => {
      showSuccess("Expense created successfully!");
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Failed to create expense");
    },
  });

  // Update expense mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExpenseRequest }) =>
      updateExpense(id, data),
    onSuccess: () => {
      showSuccess("Expense updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedExpense(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Failed to update expense");
    },
  });

  // Delete expense mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onSuccess: () => {
      showSuccess("Expense deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedExpense(null);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Failed to delete expense");
    },
  });

  // Helper functions
  const resetForm = () => {
    const now = new Date();
    setFormData({
      amount: 0,
      expenseName: "",
      categoryId: 0,
      description: "",
      paymentMethod: PaymentMethod.CASH,
      createdDate: format(now, 'yyyy-MM-dd'),
      createdTime: {
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        nano: 0
      }
    });
    setSelectedFormDate(new Date());
  };

  const handleCreateExpense = () => {
    if (!formData.amount || formData.amount <= 0) {
      showError("Amount must be greater than 0");
      return;
    }
    if (!formData.expenseName.trim()) {
      showError("Expense name is required");
      return;
    }
    if (!formData.categoryId) {
      showError("Please select a category");
      return;
    }
    if (!formData.paymentMethod) {
      showError("Please select a payment method");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdateExpense = () => {
    if (!selectedExpense) return;
    if (!formData.amount || formData.amount <= 0) {
      showError("Amount must be greater than 0");
      return;
    }
    if (!formData.expenseName.trim()) {
      showError("Expense name is required");
      return;
    }
    if (!formData.categoryId) {
      showError("Please select a category");
      return;
    }
    if (!formData.paymentMethod) {
      showError("Please select a payment method");
      return;
    }
    updateMutation.mutate({
      id: selectedExpense.id,
      data: formData,
    });
  };

  const handleDeleteExpense = () => {
    if (!selectedExpense) return;
    deleteMutation.mutate(selectedExpense.id);
  };

  const handleEditClick = (expense: ExpenseResponse) => {
    setSelectedExpense(expense);
    // Find category ID by name (since API returns categoryName but needs categoryId)
    const category = categoriesData?.content?.find(cat => cat.name === expense.categoryName);

    // Parse the date and time from the expense
    const expenseDate = new Date(expense.createdDate);
    let hour = 0, minute = 0, second = 0;

    if (expense.createdTime) {
      if (typeof expense.createdTime === 'string') {
        const timeParts = expense.createdTime.split(':');
        hour = parseInt(timeParts[0]) || 0;
        minute = parseInt(timeParts[1]) || 0;
        second = parseInt(timeParts[2]?.split('.')[0]) || 0;
      } else if (typeof expense.createdTime === 'object') {
        hour = expense.createdTime.hour || 0;
        minute = expense.createdTime.minute || 0;
        second = expense.createdTime.second || 0;
      }
    }

    setFormData({
      amount: expense.amount,
      expenseName: expense.expenseName || "",
      categoryId: category?.id || 0,
      description: expense.description,
      paymentMethod: expense.paymentMethod || PaymentMethod.CASH,
      createdDate: format(expenseDate, 'yyyy-MM-dd'),
      createdTime: { hour, minute, second, nano: 0 }
    });
    setSelectedFormDate(expenseDate);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (expense: ExpenseResponse) => {
    setSelectedExpense(expense);
    setIsDeleteDialogOpen(true);
  };

  // Memoize filtered expenses for performance (using debounced search term)
  const filteredExpenses = useMemo(() => {
    const filtered = expensesData?.content?.filter((expense) =>
      expense.expenseName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      expense.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      expense.categoryName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      expense.paymentMethod?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      expense.amount.toString().includes(debouncedSearchTerm)
    ) || [];

    console.log('Filtered expenses:', filtered);
    // Debug the first expense to see the actual data structure
    if (filtered.length > 0) {
      console.log('First expense data structure:', filtered[0]);
      console.log('CreatedDate type:', typeof filtered[0].createdDate, 'Value:', filtered[0].createdDate);
      console.log('CreatedTime type:', typeof filtered[0].createdTime, 'Value:', filtered[0].createdTime);
    }
    return filtered;
  }, [expensesData?.content, debouncedSearchTerm]);

  // Calculate expense statistics
  const expenseStats = useMemo(() => {
    if (!filteredExpenses.length) return null;

    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averageAmount = totalAmount / filteredExpenses.length;
    const highestExpense = Math.max(...filteredExpenses.map(e => e.amount));
    const lowestExpense = Math.min(...filteredExpenses.map(e => e.amount));

    // Calculate monthly comparison if we have data from current and previous month
    const currentMonth = new Date().getMonth();
    const currentMonthExpenses = filteredExpenses.filter(expense =>
      new Date(expense.createdDate).getMonth() === currentMonth
    );
    const previousMonthExpenses = filteredExpenses.filter(expense =>
      new Date(expense.createdDate).getMonth() === currentMonth - 1
    );

    const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const previousMonthTotal = previousMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthlyChange = previousMonthTotal ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0;

    return {
      totalAmount,
      averageAmount,
      highestExpense,
      lowestExpense,
      monthlyChange,
      currentMonthTotal,
      previousMonthTotal
    };
  }, [filteredExpenses]);

  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setSelectedCategoryId(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchTerm("");
    setCurrentPage(0);
  }, []);

  const formatDateTime = (date: string, time?: { hour: number; minute: number; second: number; nano?: number } | string) => {
    try {
      // Create base date object
      const dateObj = new Date(date);

      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date provided to formatDateTime:', date);
        return 'Invalid Date';
      }

      if (time) {
        if (typeof time === 'string') {
          // Handle time as string format "16:23:55.594"
          const timeComponents = time.split(':');
          if (timeComponents.length >= 2) {
            const hour = parseInt(timeComponents[0], 10);
            const minute = parseInt(timeComponents[1], 10);
            // Handle seconds which might include milliseconds (e.g., "55.594")
            const secondFloat = parseFloat(timeComponents[2] || '0');
            const second = Math.floor(secondFloat);

            // Validate time components
            if (!isNaN(hour) && !isNaN(minute) && !isNaN(second)) {
              dateObj.setHours(hour, minute, second, 0);
            }
          }
        } else if (typeof time === 'object' && time !== null) {
          // Handle time as object format { hour, minute, second, nano }
          const { hour, minute, second } = time;
          if (!isNaN(hour) && !isNaN(minute) && !isNaN(second || 0)) {
            dateObj.setHours(hour, minute, second || 0, 0);
          }
        }
      }

      // Validate final date object before formatting
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date object after processing:', { date, time });
        return 'Invalid Date';
      }

      return format(dateObj, "MMM dd, yyyy 'at' hh:mm a");
    } catch (error) {
      console.error('Error formatting date:', error, 'Date:', date, 'Time:', time);
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number) => {
    // Use the userCurrency state which is fetched from user profile
    const currencyLocaleMap: { [key: string]: string } = {
      'USD': 'en-US',
      'INR': 'en-IN',
      'EUR': 'en-EU',
      'GBP': 'en-GB',
      'JPY': 'ja-JP',
      'CAD': 'en-CA',
      'AUD': 'en-AU',
    };

    const locale = currencyLocaleMap[userCurrency] || 'en-IN'; // Default to INR locale

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: userCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      console.error('Error formatting currency:', error, 'Amount:', amount, 'Currency:', userCurrency);
      // Fallback to simple formatting
      return `${userCurrency} ${amount.toFixed(2)}`;
    }
  };

  // Loading state
  if (expensesLoading || categoriesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (expensesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
            <p className="text-muted-foreground mt-1">Manage your expenses here.</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load expenses. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your expenses
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Enhanced Summary Cards */}
      {expensesData && expenseStats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(expenseStats.totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-2/5 to-chart-2/10 border-chart-2/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'var(--chart-2)' }}>
                {formatCurrency(expenseStats.averageAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                per transaction
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-3/5 to-chart-3/10 border-chart-3/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Expense</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: 'var(--chart-3)' }}>
                {formatCurrency(expenseStats.highestExpense)}
              </div>
              <p className="text-xs text-muted-foreground">
                largest single expense
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-4/5 to-chart-4/10 border-chart-4/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Change</CardTitle>
              {expenseStats.monthlyChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-chart-4" />
              ) : (
                <TrendingDown className="h-4 w-4 text-chart-5" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${expenseStats.monthlyChange >= 0 ? 'text-chart-4' : 'text-chart-5'}`}>
                {expenseStats.monthlyChange >= 0 ? '+' : ''}{expenseStats.monthlyChange.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                vs last month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters & Search</CardTitle>
            <div className="flex items-center gap-2">
              {(searchTerm || selectedCategoryId || startDate || endDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {isFiltersOpen ? "Hide" : "Show"} Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search expenses by description, category, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Advanced Filters */}
          {isFiltersOpen && (
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="category-filter">Category</Label>
                <Select
                  value={selectedCategoryId?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedCategoryId(value ? parseInt(value) : undefined);
                    setCurrentPage(0);
                  }}
                  onOpenChange={(open) => {
                    if (open) {
                      handleCategoryDropdownOpen();
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {(categoriesLoading || isRefreshingCategories) ? (
                      <SelectItem value="loading" disabled>
                        {isRefreshingCategories ? 'Refreshing categories...' : 'Loading categories...'}
                      </SelectItem>
                    ) : categoriesData?.content?.length === 0 ? (
                      <SelectItem value="no-categories" disabled>
                        No categories found
                      </SelectItem>
                    ) : (
                      categoriesData?.content?.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearAllFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Expenses ({expensesData?.totalElements || 0} total)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(0);
              }}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!expensesData?.content ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">Loading expenses...</h3>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No expenses found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {searchTerm || selectedCategoryId || startDate || endDate
                  ? "Try adjusting your search criteria or filters."
                  : "Start tracking your expenses by adding your first expense."}
              </p>
              <Button onClick={() => {
                if (searchTerm || selectedCategoryId || startDate || endDate) {
                  clearAllFilters();
                } else {
                  resetForm();
                  setIsCreateDialogOpen(true);
                }
              }}>
                {searchTerm || selectedCategoryId || startDate || endDate
                  ? "Clear Filters"
                  : "Add First Expense"}
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Expense Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.createdDate ?
                          formatDateTime(expense.createdDate, expense.createdTime) :
                          'No Date'
                        }
                      </TableCell>
                      <TableCell className="font-medium">{expense.expenseName || '-'}</TableCell>
                      <TableCell>{expense.description || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{expense.categoryName}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.paymentMethod || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(expense)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {expensesData && expensesData.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {currentPage * pageSize + 1} to{" "}
                    {Math.min((currentPage + 1) * pageSize, expensesData.totalElements)} of{" "}
                    {expensesData.totalElements} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage + 1} of {expensesData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(expensesData.totalPages - 1, currentPage + 1))}
                      disabled={currentPage >= expensesData.totalPages - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Expense Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Create a new expense entry. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expense-name">Expense Name *</Label>
              <Input
                id="expense-name"
                type="text"
                placeholder="Enter expense name"
                value={formData.expenseName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  expenseName: e.target.value
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.categoryId.toString() || ""}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  categoryId: parseInt(value)
                }))}
                onOpenChange={(open) => {
                  if (open) {
                    handleCategoryDropdownOpen();
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {(categoriesLoading || isRefreshingCategories) ? (
                    <SelectItem value="loading" disabled>
                      {isRefreshingCategories ? 'Refreshing categories...' : 'Loading categories...'}
                    </SelectItem>
                  ) : categoriesData?.content?.length === 0 ? (
                    <SelectItem value="no-categories" disabled>
                      No categories found
                    </SelectItem>
                  ) : (
                    categoriesData?.content?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  paymentMethod: value as PaymentMethod
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                  <SelectItem value={PaymentMethod.UPI}>UPI</SelectItem>
                  <SelectItem value={PaymentMethod.CARD}>Card</SelectItem>
                  <SelectItem value={PaymentMethod.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-date">Date & Time</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !selectedFormDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedFormDate ? format(selectedFormDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={selectedFormDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedFormDate(date);
                          setFormData(prev => ({
                            ...prev,
                            createdDate: format(date, 'yyyy-MM-dd')
                          }));
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  className="w-32 text-center flex items-center justify-center [&::-webkit-datetime-edit]:text-center [&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:items-center [&::-webkit-datetime-edit]:justify-center [&::-webkit-calendar-picker-indicator]:mx-auto [&::-webkit-datetime-edit-text]:text-center [&::-webkit-datetime-edit-hour-field]:text-center [&::-webkit-datetime-edit-minute-field]:text-center"
                  style={{
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  value={`${formData.createdTime.hour.toString().padStart(2, '0')}:${formData.createdTime.minute.toString().padStart(2, '0')}`}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    setFormData(prev => ({
                      ...prev,
                      createdTime: {
                        ...prev.createdTime,
                        hour: parseInt(hours) || 0,
                        minute: parseInt(minutes) || 0
                      }
                    }));
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter expense description..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateExpense}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the expense details. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-expense-name">Expense Name *</Label>
              <Input
                id="edit-expense-name"
                type="text"
                placeholder="Enter expense name"
                value={formData.expenseName}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  expenseName: e.target.value
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.categoryId.toString() || ""}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  categoryId: parseInt(value)
                }))}
                onOpenChange={(open) => {
                  if (open) {
                    handleCategoryDropdownOpen();
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {(categoriesLoading || isRefreshingCategories) ? (
                    <SelectItem value="loading" disabled>
                      {isRefreshingCategories ? 'Refreshing categories...' : 'Loading categories...'}
                    </SelectItem>
                  ) : categoriesData?.content?.length === 0 ? (
                    <SelectItem value="no-categories" disabled>
                      No categories found
                    </SelectItem>
                  ) : (
                    categoriesData?.content?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-payment-method">Payment Method *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  paymentMethod: value as PaymentMethod
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                  <SelectItem value={PaymentMethod.UPI}>UPI</SelectItem>
                  <SelectItem value={PaymentMethod.CARD}>Card</SelectItem>
                  <SelectItem value={PaymentMethod.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date & Time</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !selectedFormDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedFormDate ? format(selectedFormDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={selectedFormDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedFormDate(date);
                          setFormData(prev => ({
                            ...prev,
                            createdDate: format(date, 'yyyy-MM-dd')
                          }));
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  className="w-32 text-center flex items-center justify-center [&::-webkit-datetime-edit]:text-center [&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:items-center [&::-webkit-datetime-edit]:justify-center [&::-webkit-calendar-picker-indicator]:mx-auto [&::-webkit-datetime-edit-text]:text-center [&::-webkit-datetime-edit-hour-field]:text-center [&::-webkit-datetime-edit-minute-field]:text-center"
                  style={{
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  value={`${formData.createdTime.hour.toString().padStart(2, '0')}:${formData.createdTime.minute.toString().padStart(2, '0')}`}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':');
                    setFormData(prev => ({
                      ...prev,
                      createdTime: {
                        ...prev.createdTime,
                        hour: parseInt(hours) || 0,
                        minute: parseInt(minutes) || 0
                      }
                    }));
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Enter expense description..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateExpense}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Updating..." : "Update Expense"}
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
              This action cannot be undone. This will permanently delete the expense
              "{selectedExpense?.description}" with amount {selectedExpense ? formatCurrency(selectedExpense.amount) : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExpense}
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

export default Expenses;