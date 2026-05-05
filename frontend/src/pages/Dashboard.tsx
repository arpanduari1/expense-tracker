import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, PiggyBank, Wallet, TrendingUp, Plus, BarChart3, FileBarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentBudget, getDefaultBudget } from "@/services/budgetService";
import { getExpenses } from "@/services/expenseService";
import { getTokenPayload } from "@/utils/tokenUtils";
import type { BudgetResponse, PageExpenseResponse } from "@/types";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userCurrency, setUserCurrency] = useState<string>(() => {
    return localStorage.getItem("userCurrency") || "USD";
  });

  const formatCurrency = useCallback(
    (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: userCurrency,
      }).format(amount);
    },
    [userCurrency]
  );

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
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
  }, []);

  const currentMonthParam = useMemo(() => {
    return format(new Date(), "yyyy-MM-dd");
  }, []);

  const { data: defaultBudget } = useQuery<BudgetResponse>({
    queryKey: ["budget", "default"],
    queryFn: getDefaultBudget,
    retry: 1,
    enabled: !!localStorage.getItem("authToken"),
    staleTime: 2 * 60 * 1000,
  });

  const { data: currentBudget } = useQuery<BudgetResponse>({
    queryKey: ["budget", "current", currentMonthParam],
    queryFn: () => getCurrentBudget(currentMonthParam),
    retry: 1,
    enabled: !!localStorage.getItem("authToken"),
    staleTime: 2 * 60 * 1000,
  });

  const {
    data: currentExpenses,
    isLoading: expensesLoading,
    error: expensesError,
  } = useQuery<PageExpenseResponse>({
    queryKey: ["expenses", "current-month", currentMonthParam],
    queryFn: () =>
      getExpenses(
        0,
        50,
        "createdDate",
        "desc",
        format(startOfMonth(new Date()), "yyyy-MM-dd"),
        format(endOfMonth(new Date()), "yyyy-MM-dd")
      ),
    retry: 1,
    enabled: !!localStorage.getItem("authToken"),
    staleTime: 2 * 60 * 1000,
  });

  const totalSpent = useMemo(() => {
    if (!currentExpenses?.content) return 0;
    return currentExpenses.content.reduce((sum, expense) => sum + expense.amount, 0);
  }, [currentExpenses]);

  const recentTransactions = useMemo(() => {
    return currentExpenses?.content?.slice(0, 5) || [];
  }, [currentExpenses]);

  const formatExpenseDate = (dateString: string) => {
    const parsed = new Date(dateString);
    if (isNaN(parsed.getTime())) return dateString;
    return format(parsed, "MMM dd");
  };

  const budgetAmount = currentBudget?.amount ?? defaultBudget?.amount ?? 0;
  const remainingAmount = Math.max(budgetAmount - totalSpent, 0);
  const budgetProgressPercent = budgetAmount > 0 ? Math.min((totalSpent / budgetAmount) * 100, 100) : 0;
  const activeBudgetLabel = currentBudget ? "Monthly Override" : defaultBudget ? "Default Budget" : "No Budget";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/expenses')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total expenses for {format(new Date(), "MMMM yyyy")}
            </p>
            {expensesError && (
              <p className="text-xs text-orange-600 mt-2">
                Unable to fetch expense data
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Budget</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {formatCurrency(budgetAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeBudgetLabel}
            </p>
            <div className="mt-2">
              <div className="w-full bg-muted rounded-full h-2 shadow-sm">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${budgetProgressPercent}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Remaining</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {formatCurrency(remainingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {budgetAmount > 0
                ? budgetAmount - totalSpent >= 0
                  ? "Budget left for this month"
                  : "Over budget this month"
                : "No budget set"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg font-semibold text-card-foreground">Recent Transactions</CardTitle>
              <span className="text-xs text-muted-foreground">
                Showing {recentTransactions.length} of {currentExpenses?.content?.length ?? 0}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-card-foreground mb-2">No recent transactions</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Your recent month expenses will appear here once you add them.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => navigate('/expenses')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                    <div>
                      <p className="font-medium text-foreground">{expense.expenseName}</p>
                      <p className="text-xs text-muted-foreground">{expense.categoryName} • {formatExpenseDate(expense.createdDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(expense.amount)}</p>
                      <p className="text-xs text-muted-foreground">{expense.paymentMethod}</p>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/expenses')}
                >
                  View all transactions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg font-semibold text-card-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <Button variant="outline" className="w-full justify-start bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md transition-all duration-200"
              onClick={() => navigate('/expenses')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Expense
            </Button>
            <Button variant="outline" className="w-full justify-start bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md transition-all duration-200"
              onClick={() => navigate('/budget')}
            >
              <PiggyBank className="h-4 w-4 mr-2" />
              Set Budget Goal
            </Button>
            <Button variant="outline" className="w-full justify-start bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md transition-all duration-200"
              onClick={() => navigate('/analytics')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
            <Button variant="outline" className="w-full justify-start bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md transition-all duration-200"
              onClick={() => navigate('/reports')}
            >
              <FileBarChart className="h-4 w-4 mr-2" />
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;