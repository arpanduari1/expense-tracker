import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import ExportDialog from "@/components/ExportDialog";
import {
  FileBarChart,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Target,
  Wallet,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getYearlyReport,
  getTopExpenses,
  getMonthlyReport,
  getInsights,
  getCategoryWiseReport,
} from "@/services/reportService";
import type {
  YearlyReportResponse,
  TopExpenseResponse,
  MonthlyReportResponse,
  InsightResponse,
  CategoryWiseMonthlyExpenseResponse,
} from "@/types";
import { showError, showSuccess } from "@/utils/toast";

const Reports = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().split('T')[0].slice(0, 7) + "-01"
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [userCurrency, setUserCurrency] = useState<string>(() => {
    return localStorage.getItem("userCurrency") || "USD";
  });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

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

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Fetch monthly report
  const {
    data: monthlyReport,
    isLoading: monthlyLoading,
    error: monthlyError,
    refetch: refetchMonthly,
  } = useQuery<MonthlyReportResponse>({
    queryKey: ["reports", "monthly", selectedMonth],
    queryFn: () => getMonthlyReport(selectedMonth),
    retry: 1,
    enabled: !!localStorage.getItem("authToken"),
  });

  // Fetch insights
  const {
    data: insights,
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights,
  } = useQuery<InsightResponse>({
    queryKey: ["reports", "insights", selectedMonth],
    queryFn: () => getInsights(selectedMonth),
    retry: 1,
    enabled: !!localStorage.getItem("authToken"),
  });

  // Fetch top expenses
  const {
    data: topExpenses,
    isLoading: topExpensesLoading,
    error: topExpensesError,
    refetch: refetchTopExpenses,
  } = useQuery<TopExpenseResponse>({
    queryKey: ["reports", "top-expenses", selectedMonth],
    queryFn: () => getTopExpenses(selectedMonth, 5),
    retry: 1,
    enabled: !!localStorage.getItem("authToken"),
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

  // Fetch yearly report
  const {
    data: yearlyReport,
    isLoading: yearlyLoading,
    error: yearlyError,
    refetch: refetchYearly,
  } = useQuery<YearlyReportResponse>({
    queryKey: ["reports", "yearly", selectedYear],
    queryFn: () => getYearlyReport(selectedYear),
    retry: 1,
    enabled: !!localStorage.getItem("authToken"),
  });

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

  // Create a simple category-to-icon mapping from the category-wise report for use in other sections
  const simpleCategoryIconMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (categoryReport?.categoryWiseExpenses) {
      categoryReport.categoryWiseExpenses.forEach((category) => {
        if (category.icon) {
          map[category.category] = category.icon;
        }
      });
    }
    return map;
  }, [categoryReport]);

  // Handle refresh all reports
  const handleRefreshAll = () => {
    refetchMonthly();
    refetchInsights();
    refetchTopExpenses();
    refetchCategory();
    refetchYearly();
    showSuccess("Reports refreshed successfully!");
  };

  // Check if user has any data for the selected month
  const hasMonthlyData = useMemo(() => {
    if (monthlyLoading || insightsLoading || topExpensesLoading || categoryLoading) {
      return true; // Still loading, show loading state
    }
    
    // Check if we have any meaningful data
    const hasExpenses = monthlyReport && (monthlyReport.totalExpenses > 0 || monthlyReport.budget > 0);
    const hasInsights = insights && (insights.mostExpensiveDay || insights.expensiveCategory);
    const hasTopExpenses = topExpenses && topExpenses.topExpenses && topExpenses.topExpenses.length > 0;
    const hasCategoryData = categoryReport && categoryReport.categoryWiseExpenses && categoryReport.categoryWiseExpenses.length > 0;
    
    return hasExpenses || hasInsights || hasTopExpenses || hasCategoryData;
  }, [monthlyReport, insights, topExpenses, categoryReport, monthlyLoading, insightsLoading, topExpensesLoading, categoryLoading]);

  // Calculate spending percentage
  const spendingPercentage = useMemo(() => {
    if (!monthlyReport?.budget || monthlyReport.budget === 0) return 0;
    return Math.min((monthlyReport.totalExpenses / monthlyReport.budget) * 100, 100);
  }, [monthlyReport]);

  // Get spending status
  const spendingStatus = useMemo(() => {
    if (!monthlyReport) return { color: "gray", label: "No Data" };
    const percentage = spendingPercentage;
    if (percentage <= 50) return { color: "green", label: "On Track" };
    if (percentage <= 80) return { color: "yellow", label: "Caution" };
    if (percentage <= 100) return { color: "orange", label: "High Spending" };
    return { color: "red", label: "Over Budget" };
  }, [spendingPercentage]);

  // Error handling component
  const ErrorMessage = ({ error, onRetry }: { error: any; onRetry: () => void }) => (
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileBarChart className="h-8 w-8" />
            Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your spending patterns and financial trends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
          <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Date Controls */}
      <Card className="border-border bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">Report Filters</CardTitle>
          <CardDescription>Select the time period for your reports</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-2">
            <Label htmlFor="month">Month</Label>
            <Input
              id="month"
              type="month"
              value={selectedMonth.slice(0, 7)}
              onChange={(e) => setSelectedMonth(e.target.value + "-01")}
              className="w-full sm:w-auto"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year for Yearly Report</Label>
            <Input
              id="year"
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              min="2020"
              max="2030"
              className="w-full sm:w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* No Data State */}
      {!hasMonthlyData && !monthlyLoading && !insightsLoading && !topExpensesLoading && !categoryLoading && (
        <Card className="border-border bg-card shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted/20 p-6 mb-6">
              <FileBarChart className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              You don't have any expense data for{" "}
              <span className="font-medium">
                {selectedMonth ? format(parseISO(selectedMonth), "MMMM yyyy") : "this month"}
              </span>. 
              Try selecting a different month or start tracking your expenses.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/expenses")} className="bg-primary hover:bg-primary/90">
                Add Expense
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedMonth(new Date().toISOString().split('T')[0].slice(0, 7) + "-01")}
              >
                View Current Month
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Overview - Only show if there's data */}
      {hasMonthlyData && (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : monthlyError ? (
              <span className="text-destructive text-sm">Error loading</span>
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(monthlyReport?.totalExpenses || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedMonth ? format(parseISO(selectedMonth), "MMMM yyyy") : "Current month"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : monthlyError ? (
              <span className="text-destructive text-sm">Error loading</span>
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(monthlyReport?.budget || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">Monthly budget limit</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            {(monthlyReport?.netSavings || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : monthlyError ? (
              <span className="text-destructive text-sm">Error loading</span>
            ) : (
              <div className={`text-2xl font-bold ${(monthlyReport?.netSavings || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(monthlyReport?.netSavings || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {(monthlyReport?.netSavings || 0) >= 0 ? "Saved this month" : "Over budget"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : monthlyError ? (
              <span className="text-destructive text-sm">Error loading</span>
            ) : (
              <>
                <div className="text-2xl font-bold">{spendingPercentage.toFixed(1)}%</div>
                <div className="mt-2 space-y-1">
                  <Progress value={spendingPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Used</span>
                    <Badge variant={spendingStatus.color === "green" ? "default" : spendingStatus.color === "red" ? "destructive" : "secondary"}>
                      {spendingStatus.label}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      )}

      {/* Insights Section - Only show if there's data */}
      {hasMonthlyData && (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Monthly Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insightsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : insightsError ? (
              <ErrorMessage error={insightsError} onRetry={refetchInsights} />
            ) : insights && insights.mostExpensiveDay ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Most Expensive Day</span>
                  <div className="text-right">
                    <div className="font-semibold">{format(parseISO(insights.mostExpensiveDay), "MMM dd, yyyy")}</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(insights.amountOnMostExpensiveDay || 0)}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Average Daily Spending</span>
                  <div className="font-semibold">{formatCurrency(insights.averageDailySpending || 0)}</div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Top Category</span>
                  <div className="text-right">
                    <div className="font-semibold flex items-center gap-2 justify-end">
                      {insights.expensiveCategory && (
                        <span className="text-lg">{simpleCategoryIconMap[insights.expensiveCategory] || getCategoryIcon(insights.expensiveCategory)}</span>
                      )}
                      <span>{insights.expensiveCategory || "N/A"}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(insights.expensiveCategorySpending || 0)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No insights available for this month</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Expense Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topExpensesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : topExpensesError ? (
              <ErrorMessage error={topExpensesError} onRetry={refetchTopExpenses} />
            ) : topExpenses?.topExpenses?.length ? (
              <div className="space-y-3">
                {topExpenses.topExpenses.map((expense, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-lg">{simpleCategoryIconMap[expense.category] || getCategoryIcon(expense.category)}</span>
                      <span className="font-medium">{expense.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(expense.amount)}</div>
                      <div className="text-sm text-muted-foreground">{expense.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No expense data available</p>
            )}
          </CardContent>
        </Card>
      </div>
      )}

      {/* Category Breakdown - Only show if there's data */}
      {hasMonthlyData && (
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
              <p className="text-muted-foreground">No category data available for this month</p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Yearly Overview - Only show if there's data */}
      {hasMonthlyData && (
      <Card className="border-border bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Yearly Overview - {selectedYear}
          </CardTitle>
          <CardDescription>
            Monthly breakdown of expenses, budget, and savings for the year
          </CardDescription>
        </CardHeader>
        <CardContent>
          {yearlyLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <Skeleton className="h-4 w-16 mb-3" />
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-4 w-18 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : yearlyError ? (
            <ErrorMessage error={yearlyError} onRetry={refetchYearly} />
          ) : yearlyReport?.monthlyReports ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Object.entries(yearlyReport.monthlyReports).map(([month, data]) => (
                <div key={month} className="p-4 border border-border rounded-lg bg-muted/20">
                  <div className="font-medium text-sm mb-3 capitalize">{month}</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">{formatCurrency(data.budget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Spent:</span>
                      <span className="font-medium">{formatCurrency(data.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Savings:</span>
                      <span className={`font-medium ${data.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.netSavings)}
                      </span>
                    </div>
                    <Progress 
                      value={data.budget > 0 ? Math.min((data.totalExpenses / data.budget) * 100, 100) : 0} 
                      className="h-1 mt-2" 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No yearly data available for {selectedYear}</p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        currentMonth={selectedMonth}
        currentYear={selectedYear}
      />
    </div>
  );
};

export default Reports;
