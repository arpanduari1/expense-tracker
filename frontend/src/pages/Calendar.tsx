import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Edit, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getDailyExpensesByDate } from "@/services/reportService";
import { getCategories } from "@/services/categoryService";
import { updateExpense, createExpense } from "@/services/expenseService";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";
import type { 
  DailyExpenseResponse, 
  DailyExpensesResponse, 
  ExpenseRequest, 
  ExpenseUpdateRequest,
  PageCategoryResponse 
} from "@/types";
import { PaymentMethod } from "@/types";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userCurrency, setUserCurrency] = useState<string>(() => {
    return localStorage.getItem('userCurrency') || 'INR';
  });
  
  // Edit expense state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<DailyExpenseResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState<ExpenseRequest>({
    amount: 0,
    expenseName: "",
    categoryId: 0,
    description: "",
    paymentMethod: PaymentMethod.CASH,
    createdDate: "",
    createdTime: {
      hour: 0,
      minute: 0,
      second: 0,
      nano: 0
    }
  });
  const [originalFormData, setOriginalFormData] = useState<ExpenseRequest | null>(null);

  const queryClient = useQueryClient();
  
  const monthKey = format(currentDate, "yyyy-MM-dd");
  
  const { data: dailyExpenses, isLoading, error } = useQuery({
    queryKey: ["daily-expenses", monthKey],
    queryFn: () => getDailyExpensesByDate(monthKey),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch categories for dropdown
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<PageCategoryResponse>({
    queryKey: ["categories"],
    queryFn: () => getCategories(0, 50), // Get more categories for dropdown
    retry: 2,
  });

  // Update expense mutation
  const updateMutation = useMutation({
    mutationFn: ({ expenseId, expenseData }: { expenseId: number; expenseData: Partial<ExpenseRequest> }) => {
      return updateExpense(expenseId, expenseData);
    },
    onSuccess: () => {
      showSuccess("Expense updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedExpense(null);
      setOriginalFormData(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["daily-expenses"] });
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Failed to update expense");
    },
  });

  // Create expense mutation
  const createMutation = useMutation({
    mutationFn: (expenseData: ExpenseRequest) => createExpense(expenseData),
    onSuccess: () => {
      showSuccess("Expense created successfully!");
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["daily-expenses"] });
    },
    onError: (error: any) => {
      showError(error.response?.data?.message || "Failed to create expense");
    },
  });

  // Debug logging
  useEffect(() => {
    if (dailyExpenses) {
      console.log('Daily expenses data received:', dailyExpenses);
    }
    if (error) {
      console.error('Error fetching daily expenses:', error);
    }
  }, [dailyExpenses, error]);

  // Helper functions
  const resetForm = () => {
    const defaultFormData = {
      amount: 0,
      expenseName: "",
      categoryId: 0,
      description: "",
      paymentMethod: PaymentMethod.CASH,
      createdDate: "",
      createdTime: {
        hour: 0,
        minute: 0,
        second: 0,
        nano: 0
      }
    };
    setFormData(defaultFormData);
    setOriginalFormData(null);
    setSelectedDate(undefined);
  };

  const handleEditExpense = (expense: DailyExpenseResponse) => {
    setSelectedExpense(expense);
    // Find category ID by name
    const category = categoriesData?.content?.find(cat => cat.name === expense.category);
    
    // Parse the date and time
    const expenseDate = new Date(expense.createdDate);
    let hour = 0, minute = 0, second = 0;
    
    if (expense.createdAtTime) {
      if (typeof expense.createdAtTime === 'string') {
        const timeParts = expense.createdAtTime.split(':');
        hour = parseInt(timeParts[0]) || 0;
        minute = parseInt(timeParts[1]) || 0;
        second = parseInt(timeParts[2]?.split('.')[0]) || 0;
      } else if (typeof expense.createdAtTime === 'object') {
        hour = expense.createdAtTime.hour || 0;
        minute = expense.createdAtTime.minute || 0;
        second = expense.createdAtTime.second || 0;
      }
    }
    
    const editFormData = {
      amount: expense.amount,
      expenseName: expense.expenseName || "",
      categoryId: category?.id || 0,
      description: expense.description,
      paymentMethod: expense.paymentMethod || PaymentMethod.CASH,
      createdDate: format(expenseDate, 'yyyy-MM-dd'),
      createdTime: { hour, minute, second, nano: 0 }
    };
    
    setFormData(editFormData);
    setOriginalFormData(editFormData); // Store original values for change detection
    setSelectedDate(expenseDate);
    setIsEditDialogOpen(true);
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

  // Helper function to get only changed fields
  const getChangedFields = (original: ExpenseRequest, current: ExpenseRequest): Partial<ExpenseRequest> => {
    const changes: Partial<ExpenseRequest> = {};
    
    if (original.amount !== current.amount) changes.amount = current.amount;
    if (original.expenseName !== current.expenseName) changes.expenseName = current.expenseName;
    if (original.categoryId !== current.categoryId) changes.categoryId = current.categoryId;
    if (original.description !== current.description) changes.description = current.description;
    if (original.paymentMethod !== current.paymentMethod) changes.paymentMethod = current.paymentMethod;
    if (original.createdDate !== current.createdDate) changes.createdDate = current.createdDate;
    
    // Compare createdTime
    const originalTime = original.createdTime;
    const currentTime = current.createdTime;
    if (originalTime && currentTime && 
        (originalTime.hour !== currentTime.hour || 
         originalTime.minute !== currentTime.minute || 
         originalTime.second !== currentTime.second)) {
      changes.createdTime = currentTime;
    }
    
    return changes;
  };

  const handleUpdateExpense = () => {
    if (!selectedExpense?.id) {
      showError("No expense selected for update");
      return;
    }
    
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
    
    // Get only the fields that have changed
    const changedFields = originalFormData ? getChangedFields(originalFormData, formData) : formData;
    
    // If no fields have changed, show a message
    if (originalFormData && Object.keys(changedFields).length === 0) {
      showError("No changes detected");
      return;
    }
    
    updateMutation.mutate({ 
      expenseId: selectedExpense.id, 
      expenseData: changedFields 
    });
  };

  const handleCreateFromDate = (date: Date) => {
    const now = new Date();
    setFormData({
      amount: 0,
      expenseName: "",
      categoryId: 0,
      description: "",
      paymentMethod: PaymentMethod.CASH,
      createdDate: format(date, 'yyyy-MM-dd'),
      createdTime: {
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        nano: 0
      }
    });
    setSelectedDate(date);
    setIsCreateDialogOpen(true);
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add days from previous month to fill the first week
    const firstDayOfWeek = monthStart.getDay();
    const daysFromPrevMonth = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDay = new Date(monthStart);
      prevDay.setDate(prevDay.getDate() - (i + 1));
      daysFromPrevMonth.push(prevDay);
    }
    
    // Add days from next month to fill the last week
    const lastDayOfWeek = monthEnd.getDay();
    const daysFromNextMonth = [];
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      const nextDay = new Date(monthEnd);
      nextDay.setDate(nextDay.getDate() + i);
      daysFromNextMonth.push(nextDay);
    }
    
    return [...daysFromPrevMonth, ...days, ...daysFromNextMonth];
  }, [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getExpensesForDay = (day: Date): DailyExpenseResponse[] => {
    const dayKey = format(day, "yyyy-MM-dd");
    return dailyExpenses?.[dayKey] || [];
  };

  const getTotalForDay = (expenses: DailyExpenseResponse[]): number => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const formatCurrency = (amount: number): string => {
    // Use the userCurrency state with proper locale mapping
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
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback formatting if Intl.NumberFormat fails
      console.error('Currency formatting error:', error);
      const symbol = userCurrency === 'INR' ? '₹' : '$';
      return `${symbol}${amount.toFixed(2)}`;
    }
  };

  const ExpenseCard = ({ expense }: { expense: DailyExpenseResponse }) => {
    // Safely format time with fallbacks
    const formatTime = () => {
      try {
        // Handle createdAtTime as string (actual API format)
        if (expense.createdAtTime && typeof expense.createdAtTime === 'string') {
          // Parse time string like "13:57:43.771" or "00:12:24"
          const timeStr = expense.createdAtTime.split('.')[0]; // Remove milliseconds if present
          const [hours, minutes] = timeStr.split(':');
          if (hours && minutes) {
            return `${hours}:${minutes}`;
          }
        }
        
        // Fallback: Handle createdAtTime as object (if backend changes)
        if (expense.createdAtTime && 
            typeof expense.createdAtTime === 'object' &&
            expense.createdAtTime.hour !== undefined && 
            expense.createdAtTime.minute !== undefined) {
          const hour = expense.createdAtTime.hour.toString().padStart(2, '0');
          const minute = expense.createdAtTime.minute.toString().padStart(2, '0');
          return `${hour}:${minute}`;
        }
        
        // Try to extract time from createdDate if available
        if (expense.createdDate) {
          try {
            const date = parseISO(expense.createdDate);
            return format(date, 'HH:mm');
          } catch {
            // If parsing fails, don't show time
            return null;
          }
        }
        
        return null; // Don't show time when not available
      } catch (error) {
        console.error('Error formatting time:', error, expense);
        return null;
      }
    };

    return (
      <div 
        className="rounded-md p-2 mb-1 text-xs border transition-all duration-200 cursor-pointer group bg-[#ffe6c4] dark:bg-[#42382e] border-[#d4b896] dark:border-[#5c4a3e] hover:bg-[#ffddb0] dark:hover:bg-[#4a403a] hover:border-[#c9a882] dark:hover:border-[#645248] hover:shadow-sm relative"
        onClick={() => handleEditExpense(expense)}
        title="Click to edit expense"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground truncate flex-1 group-hover:text-foreground/90">
            {expense.expenseName || expense.description || 'No name'}
          </span>
          <div className="flex items-center gap-1">
            <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs font-semibold text-foreground ml-1 group-hover:text-foreground/90">
              {formatCurrency(expense.amount || 0)}
            </span>
          </div>
        </div>
        {expense.description && (
          <div className="text-xs text-muted-foreground truncate mt-1 group-hover:text-muted-foreground/80">
            {expense.description}
          </div>
        )}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs px-1 py-0 bg-[#644a40] dark:bg-[#393028] text-white dark:text-[#ffe0c2] hover:bg-[#5a4238] dark:hover:bg-[#332a21]">
              {expense.category || 'Uncategorized'}
            </Badge>
            {expense.paymentMethod && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {expense.paymentMethod}
              </Badge>
            )}
          </div>
          {formatTime() && (
            <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80">
              {formatTime()}
            </span>
          )}
        </div>
      </div>
    );
  };

  const DayCell = ({ day }: { day: Date }) => {
    const expenses = getExpensesForDay(day);
    const total = getTotalForDay(expenses);
    const isCurrentMonth = isSameMonth(day, currentDate);
    const dayIsToday = isToday(day);

    return (
      <div
        className={cn(
          "min-h-[100px] p-2 bg-card transition-colors hover:bg-accent/50 flex flex-col border-r border-b border-border dark:border-[rgb(92,81,71)]",
          !isCurrentMonth && "bg-muted/30 text-muted-foreground",
          dayIsToday && "!border-2 !border-[#3d2a20] dark:!border-[rgb(255,224,194)] bg-primary/5 dark:bg-primary/10"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className={cn(
              "text-sm font-medium text-foreground",
              dayIsToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm"
            )}
          >
            {format(day, "d")}
          </span>
          {isCurrentMonth && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateFromDate(day);
              }}
              title="Add expense for this day"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div className="space-y-1 flex-1 group">
          {expenses.map((expense, index) => (
            <ExpenseCard key={`${expense.description}-${index}`} expense={expense} />
          ))}
        </div>

        {isCurrentMonth && total > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="text-center">
              <span className="text-xs font-semibold text-foreground bg-primary/10 px-2 py-1 rounded-md border border-border/50">
                Total: {formatCurrency(total)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-destructive">
              Error Loading Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Unable to load expense data. Please try refreshing the page.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-foreground">
              {format(currentDate, "MMMM yyyy")}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="h-10 flex items-center justify-center text-sm font-medium text-muted-foreground bg-muted/50 rounded border border-border/30 dark:border-[rgb(92,81,71)]"
              >
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 border-l border-t border-border bg-background rounded-lg overflow-hidden shadow-sm dark:border-[rgb(92,81,71)]" style={{ gridAutoRows: 'min-content' }}>
            {calendarDays.map((day, index) => (
              <DayCell key={`${format(day, "yyyy-MM-dd")}-${index}`} day={day} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Expense Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Create a new expense entry for {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'selected date'}. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-expense-name">Expense Name *</Label>
              <Input
                id="create-expense-name"
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
              <Label htmlFor="create-amount">Amount *</Label>
              <Input
                id="create-amount"
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
              <Label htmlFor="create-category">Category</Label>
              <Select
                value={formData.categoryId.toString() || ""}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  categoryId: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading categories...
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
              <Label htmlFor="create-payment-method">Payment Method *</Label>
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
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
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
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
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
              Update the expense details for {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'selected date'}. Fields marked with * are required.
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
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading categories...
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
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
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
    </div>
  );
};

export default Calendar;
