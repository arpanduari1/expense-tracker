import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Plus,
  Target,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { getTokenPayload, isTokenExpired } from "@/utils/tokenUtils";
import {
  getCurrentBudget,
  getDefaultBudget,
  setDefaultBudget,
  setMonthlyBudget,
} from "@/services/budgetService";
import { getExpenses } from "@/services/expenseService";
import type { BudgetRequest, BudgetResponse, PageExpenseResponse } from "@/types";

const Budget = () => {
  // State management
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDefaultBudgetDialogOpen, setIsDefaultBudgetDialogOpen] = useState(false);
  const [userCurrency, setUserCurrency] = useState<string>(() => {
    return localStorage.getItem("userCurrency") || "USD";
  });

  // Form state
  const [defaultBudgetAmount, setDefaultBudgetAmount] = useState<string>("");
  const [isMonthlyBudgetDialogOpen, setIsMonthlyBudgetDialogOpen] = useState(false);
  const [monthlyBudgetAmount, setMonthlyBudgetAmount] = useState<string>("");

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Format currency helper
  const formatCurrency = useCallback(
    (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: userCurrency,
      }).format(amount);
    },
    [userCurrency]
  );

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token || isTokenExpired(token)) {
      navigate("/login");
      return;
    }

    try {
      const payload = getTokenPayload(token);
      if (payload?.currency) {
        setUserCurrency(payload.currency);
        localStorage.setItem("userCurrency", payload.currency);
      }
    } catch (error) {
      console.error("Error parsing token:", error);
    }
  }, [navigate]);

  // Get current month in YYYY-MM-DD format
  const currentMonthParam = useMemo(() => {
    return format(selectedDate, "yyyy-MM-dd");
  }, [selectedDate]);

  // State to track if user has completed budget setup
  const [hasAttemptedBudgetFetch, setHasAttemptedBudgetFetch] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [hasJustSetupBudget, setHasJustSetupBudget] = useState(false);

  // Fetch default budget first to check if user is new
  const {
    data: defaultBudget,
    isLoading: defaultBudgetLoading,
    error: defaultBudgetError,
    refetch: refetchDefaultBudget,
  } = useQuery<BudgetResponse>({
    queryKey: ["budget", "default"],
    queryFn: getDefaultBudget,
    retry: 1,
    enabled: !!localStorage.getItem("authToken"),
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  });

  // Check if user is new based on default budget error
  useEffect(() => {
    if (defaultBudgetError) {
      console.log("Default budget error:", defaultBudgetError);
      // Check if this is a 404 (no default budget found) - indicates new user
      const errorStatus = (defaultBudgetError as any).response?.status;
      if (errorStatus === 404 || errorStatus === 400) {
        setIsNewUser(true);
        console.log("Detected new user - no default budget found");
      } else {
        // Other errors might be temporary, so we don't mark as new user
        console.error("Error fetching default budget:", defaultBudgetError);
      }
      setHasAttemptedBudgetFetch(true);
    } else if (defaultBudget) {
      console.log("Default budget found:", defaultBudget);
      setIsNewUser(false);
      setHasAttemptedBudgetFetch(true);
    }
  }, [defaultBudgetError, defaultBudget]);

  // Only fetch current budget if we have a default budget (user is not new)
  // Note: This might fail if no monthly budget is set, which is fine - we'll use default budget as fallback
  const {
    data: currentBudget,
    isLoading: currentBudgetLoading,
    error: currentBudgetError,
    refetch: refetchCurrentBudget,
  } = useQuery<BudgetResponse>({
    queryKey: ["budget", "current", currentMonthParam],
    queryFn: () => getCurrentBudget(currentMonthParam),
    retry: 1,
    enabled: !!localStorage.getItem("authToken") && !isNewUser && hasAttemptedBudgetFetch && !!defaultBudget,
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  });

  // Fetch expenses for current month to calculate spending (only if user has budget setup)
  const {
    data: currentExpenses,
    isLoading: expensesLoading,
    error: expensesError,
  } = useQuery<PageExpenseResponse>({
    queryKey: ["expenses", "current-month", currentMonthParam],
    queryFn: () =>
      getExpenses(
        0,
        50, // Get up to 50 expenses for the month
        "createdDate",
        "desc",
        format(startOfMonth(selectedDate), "yyyy-MM-dd"),
        format(endOfMonth(selectedDate), "yyyy-MM-dd")
      ),
    retry: 1,
    enabled: !!localStorage.getItem("authToken") && !isNewUser && hasAttemptedBudgetFetch && !!defaultBudget, // Only enabled after default budget is set
  });

  // Log budget errors for debugging (but don't treat missing monthly budget as error)
  useEffect(() => {
    if (currentBudgetError) {
      const errorStatus = (currentBudgetError as any).response?.status;
      // Don't log 404 errors for monthly budget as error - it's expected when no monthly budget is set
      if (errorStatus !== 404) {
        console.error("Error fetching current budget:", currentBudgetError);
      } else {
        console.log("No monthly budget found, using default budget");
      }
    }
    if (defaultBudgetError) {
      console.error("Error fetching default budget:", defaultBudgetError);
    }
  }, [currentBudgetError, defaultBudgetError]);

  // Log expenses error for debugging
  useEffect(() => {
    if (expensesError) {
      console.error("Error fetching expenses for budget calculation:", expensesError);
    }
  }, [expensesError]);

  // Calculate total spending for current month
  const totalSpent = useMemo(() => {
    if (!currentExpenses?.content) return 0;
    return currentExpenses.content.reduce((sum, expense) => sum + expense.amount, 0);
  }, [currentExpenses]);

  // Calculate budget progress (use default budget when monthly budget doesn't exist)
  const budgetProgress = useMemo(() => {
    // Use monthly budget if available, otherwise fall back to default budget
    const budget = currentBudget?.amount || defaultBudget?.amount || 0;
    // Use totalSpent only if we successfully fetched expenses, otherwise show 0
    const spent = expensesError ? 0 : totalSpent;
    const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    
    return {
      budget,
      spent,
      remaining: Math.max(budget - spent, 0),
      percentage,
      hasBudgetData: !!(currentBudget || defaultBudget),
      hasSpendingData: !expensesError && !!currentExpenses,
      isUsingDefaultBudget: !currentBudget && !!defaultBudget, // Track if we're using default as fallback
    };
  }, [currentBudget, defaultBudget, totalSpent, expensesError, currentExpenses]);

  // Mutations
  const setDefaultBudgetMutation = useMutation({
    mutationFn: (amount: number) => setDefaultBudget({ amount }),
    onSuccess: () => {
      showSuccess("Default budget updated successfully!");
      setIsDefaultBudgetDialogOpen(false);
      setDefaultBudgetAmount("");
      setIsNewUser(false); // User is no longer new after setting default budget
      setHasAttemptedBudgetFetch(true);
      setHasJustSetupBudget(true); // Track that user just completed setup
      refetchDefaultBudget();
      // Don't automatically refetch current budget since it might not exist and that's okay
    },
    onError: (error: any) => {
      console.error("Set default budget error:", error);
      showError(error.response?.data?.message || "Failed to update default budget");
    },
  });

  const setMonthlyBudgetMutation = useMutation({
    mutationFn: (data: { amount: number; month: string }) => 
      setMonthlyBudget({ amount: data.amount, month: data.month }),
    onSuccess: () => {
      showSuccess("Monthly budget set successfully!");
      setIsMonthlyBudgetDialogOpen(false);
      setMonthlyBudgetAmount("");
      refetchCurrentBudget();
    },
    onError: (error: any) => {
      console.error("Set monthly budget error:", error);
      showError(error.response?.data?.message || "Failed to set monthly budget");
    },
  });

  // Handle form submissions
  const handleSetDefaultBudget = () => {
    const amount = parseFloat(defaultBudgetAmount);
    if (isNaN(amount) || amount <= 0) {
      showError("Please enter a valid budget amount greater than 0");
      return;
    }
    if (amount > 1000000) {
      showError("Budget amount seems too high. Please enter a reasonable amount.");
      return;
    }
    setDefaultBudgetMutation.mutate(amount);
  };

  const handleSetMonthlyBudget = () => {
    const amount = parseFloat(monthlyBudgetAmount);
    if (isNaN(amount) || amount <= 0) {
      showError("Please enter a valid budget amount greater than 0");
      return;
    }
    if (amount > 1000000) {
      showError("Budget amount seems too high. Please enter a reasonable amount.");
      return;
    }
    const monthString = format(selectedDate, "yyyy-MM-dd");
    setMonthlyBudgetMutation.mutate({ amount, month: monthString });
  };

  // Month navigation functions
  const goToPreviousMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const goToCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  // Show loading state while checking if user is new
  if (defaultBudgetLoading && !hasAttemptedBudgetFetch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-muted rounded animate-pulse w-32" />
            <div className="h-4 bg-muted rounded animate-pulse w-64 mt-2" />
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up your budget dashboard...</p>
        </div>
      </div>
    );
  }

  // Show new user onboarding
  if (isNewUser) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Welcome to Budget Management!</h1>
          <p className="text-muted-foreground mt-2">
            Let's get you started by setting up your first budget
          </p>
        </div>

        {/* Onboarding Cards */}
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Step 1: Set Default Budget */}
            <Card className="border-border bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <CardTitle className="text-xl">Set Your Default Budget</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Start by setting a default monthly budget. This will be used for all months unless you specify otherwise.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-blue-50/50 dark:bg-blue-950/50 rounded-lg">
                  <PiggyBank className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium">Default Budget</p>
                    <p className="text-sm text-muted-foreground">
                      Set a baseline amount for all months
                    </p>
                  </div>
                </div>
                <Dialog open={isDefaultBudgetDialogOpen} onOpenChange={setIsDefaultBudgetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Set Default Budget
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Your Default Budget</DialogTitle>
                      <DialogDescription>
                        Set a default budget that will be used for all months unless specifically overridden.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="default-amount">Budget Amount ({userCurrency})</Label>
                        <Input
                          id="default-amount"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Enter your monthly budget (e.g., 1000.00)"
                          value={defaultBudgetAmount}
                          onChange={(e) => setDefaultBudgetAmount(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSetDefaultBudget();
                            }
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleSetDefaultBudget}
                        disabled={setDefaultBudgetMutation.isPending}
                        className="w-full"
                      >
                        {setDefaultBudgetMutation.isPending ? "Setting up..." : "Set Default Budget"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Step 2: Optional Monthly Budget */}
            <Card className="border-border bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <CardTitle className="text-xl">Monthly Budget (Optional)</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Optionally, set a specific budget for this month that differs from your default.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-purple-50/50 dark:bg-purple-950/50 rounded-lg">
                  <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="font-medium">Monthly Override</p>
                    <p className="text-sm text-muted-foreground">
                      Set a custom budget for {format(selectedDate, "MMMM yyyy")}
                    </p>
                  </div>
                </div>
                <Dialog open={isMonthlyBudgetDialogOpen} onOpenChange={setIsMonthlyBudgetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" size="lg">
                      <Target className="h-4 w-4 mr-2" />
                      Set Monthly Budget
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Monthly Budget</DialogTitle>
                      <DialogDescription>
                        Set a specific budget for {format(selectedDate, "MMMM yyyy")}. This will override the default budget for this month.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="monthly-amount">Budget Amount ({userCurrency})</Label>
                        <Input
                          id="monthly-amount"
                          type="number"
                          placeholder="Enter budget for this month"
                          value={monthlyBudgetAmount}
                          onChange={(e) => setMonthlyBudgetAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleSetMonthlyBudget}
                        disabled={setMonthlyBudgetMutation.isPending}
                        className="w-full"
                      >
                        {setMonthlyBudgetMutation.isPending ? "Setting..." : "Set Monthly Budget"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Help Section */}
          <Card className="mt-6 border-border bg-card shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Getting Started Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Start Simple</p>
                    <p className="text-xs text-muted-foreground">Set a realistic default budget based on your typical monthly expenses.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs text-blue-600 dark:text-blue-400">i</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Monthly Overrides</p>
                    <p className="text-xs text-muted-foreground">Use monthly budgets for special months with different spending patterns.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs text-purple-600 dark:text-purple-400">→</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Track Progress</p>
                    <p className="text-xs text-muted-foreground">Once set up, you'll see real-time tracking of your budget vs. spending.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome message for users who just set up their budget */}
      {hasJustSetupBudget && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Great! Your budget is now set up.
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Start adding expenses to track your spending against your budget. You can always adjust your budget settings using the buttons above.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHasJustSetupBudget(false)}
                className="ml-auto text-green-700 hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Budget Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your monthly budgets
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isDefaultBudgetDialogOpen} onOpenChange={setIsDefaultBudgetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Set Default Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Default Budget</DialogTitle>
                <DialogDescription>
                  Set a default budget that will be used for all months unless specifically overridden.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-amount">Budget Amount ({userCurrency})</Label>
                  <Input
                    id="default-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={defaultBudgetAmount}
                    onChange={(e) => setDefaultBudgetAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSetDefaultBudget();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSetDefaultBudget}
                  disabled={setDefaultBudgetMutation.isPending}
                >
                  {setDefaultBudgetMutation.isPending ? "Setting..." : "Set Default Budget"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isMonthlyBudgetDialogOpen} onOpenChange={setIsMonthlyBudgetDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-md">
                <Target className="h-4 w-4 mr-2" />
                Set Monthly Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Monthly Budget</DialogTitle>
                <DialogDescription>
                  Set a specific budget for {format(selectedDate, "MMMM yyyy")}. This will override the default budget for this month.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly-amount">Budget Amount ({userCurrency})</Label>
                  <Input
                    id="monthly-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={monthlyBudgetAmount}
                    onChange={(e) => setMonthlyBudgetAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSetMonthlyBudget();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSetMonthlyBudget}
                  disabled={setMonthlyBudgetMutation.isPending}
                >
                  {setMonthlyBudgetMutation.isPending ? "Setting..." : "Set Monthly Budget"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4 py-4">
        <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">
            {format(selectedDate, "MMMM yyyy")}
          </h2>
          {format(selectedDate, "yyyy-MM") !== format(new Date(), "yyyy-MM") && (
            <Button variant="ghost" size="sm" onClick={goToCurrentMonth}>
              (Go to current)
            </Button>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Current Budget Card */}
        <Card className="border-border bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Current Budget
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {budgetProgress.hasBudgetData ? formatCurrency(budgetProgress.budget) : "—"}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={currentBudget ? "default" : "secondary"} className="text-xs">
                {currentBudget ? "Override" : defaultBudget ? "Default" : "No Budget"}
              </Badge>
              {((currentBudgetError && (currentBudgetError as any).response?.status !== 404) || defaultBudgetError) && (
                <span className="text-xs text-orange-600">
                  Unable to load budget
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Spent Card */}
        <Card className="border-border bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-950 dark:to-pink-900 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Total Spent
            </CardTitle>
            <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(budgetProgress.spent)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              for {format(selectedDate, "MMMM yyyy")}
            </p>
            {expensesError && (
              <p className="text-xs text-orange-600 mt-1">
                Unable to fetch spending data
              </p>
            )}
          </CardContent>
        </Card>

        {/* Remaining Card */}
        <Card className="border-border bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Remaining
            </CardTitle>
            <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(budgetProgress.remaining)}
            </div>
            <div className="flex items-center mt-2">
              {budgetProgress.remaining > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 mr-1" />
              )}
              <span className="text-xs text-muted-foreground">
                {budgetProgress.remaining > 0 ? "Under budget" : "Over budget"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card className="border-border bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Progress
            </CardTitle>
            <div className="text-sm font-medium text-foreground">
              {budgetProgress.percentage.toFixed(1)}%
            </div>
          </CardHeader>
          <CardContent>
            <Progress 
              value={budgetProgress.percentage} 
              className="w-full mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              of {format(selectedDate, "MMMM")} budget used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error States - only show real errors, not missing monthly budget */}
      {currentBudgetError && (currentBudgetError as any).response?.status !== 404 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Error loading budget data: {currentBudgetError.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Budget Information */}
      <Card className="border-border bg-card shadow-lg">
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>
            Your budget status for {format(selectedDate, "MMMM yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!currentBudget && !defaultBudget && (
              <div className="text-center py-8">
                <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No budget set</p>
                <p className="text-sm text-muted-foreground">
                  Set a default budget to start tracking your spending.
                </p>
              </div>
            )}
            
            {(currentBudget || defaultBudget) && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Budget Amount:</span>
                  <span className="font-medium">{formatCurrency(budgetProgress.budget)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount Spent:</span>
                  <span className="font-medium">{formatCurrency(budgetProgress.spent)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Remaining:</span>
                  <span className={cn(
                    "font-medium",
                    budgetProgress.remaining >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(budgetProgress.remaining)}
                  </span>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{budgetProgress.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={budgetProgress.percentage} className="h-2" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error States - only show real errors, not missing monthly budget */}
      {((currentBudgetError && (currentBudgetError as any).response?.status !== 404) || defaultBudgetError) && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium mb-2">Budget API Issues</p>
            {currentBudgetError && (currentBudgetError as any).response?.status !== 404 && (
              <p className="text-sm text-destructive/80 mb-1">
                • Unable to fetch monthly budget: {currentBudgetError.message}
              </p>
            )}
            {defaultBudgetError && (
              <p className="text-sm text-destructive/80">
                • Unable to fetch default budget: {defaultBudgetError.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              The budget features may not be fully available. Please check your connection or contact support.
            </p>
          </CardContent>
        </Card>
      )}

      {expensesError && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <p className="text-orange-700 dark:text-orange-400 font-medium mb-2">Expense Data Issues</p>
            <p className="text-sm text-orange-600 dark:text-orange-500">
              Unable to fetch expense data: {expensesError.message}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Spending calculations may not be accurate. The expense tracking system may be temporarily unavailable.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Budget;
