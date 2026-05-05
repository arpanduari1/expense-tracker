import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label as RechartsLabel,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Sector,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  Activity,
  RefreshCw,
  AlertCircle,
  Wallet,
  Eye,
} from "lucide-react";
import { HighlightedMultipleBarChart } from "@/components/charts/HighlightedMultipleBarChart";
import { format, parseISO } from "date-fns";
import {
  getYearlyReport,
  getTopExpenses,
  getMonthlyReport,
  getInsights,
  getCategoryWiseReport,
} from "@/services/reportService";
import { getCategories } from "@/services/categoryService";
import type {
  YearlyReportResponse,
  TopExpenseResponse,
  MonthlyReportResponse,
  InsightResponse,
  CategoryWiseMonthlyExpenseResponse,
  PageCategoryResponse,
} from "@/types";
import { showError, showSuccess } from "@/utils/toast";

const Analytics = () => {
  const navigate = useNavigate();
  const { theme, resolvedTheme } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().split('T')[0].slice(0, 7) + "-01"
  );
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [userCurrency, setUserCurrency] = useState<string>(() => {
    return localStorage.getItem('userCurrency') || 'USD';
  });

  // Interactive pie chart state
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Define theme-based colors for pie chart
  const pieChartColors = useMemo(() => {
    const isDark = resolvedTheme === 'dark';
    if (isDark) {
      // Dark theme colors - lighter shades
      return [
        '#ffe0c2', // Base light cream
        '#ffd4a3', // Slightly darker cream  
        '#ffc784', // Light peach
        '#ffbb65', // Medium peach
        '#ffae46', // Darker peach
        '#e6975d', // Brown-peach
        '#cc8654', // Medium brown
        '#b3754b', // Darker brown
        '#996442', // Dark brown
        '#805339', // Very dark brown
      ];
    } else {
      // Light theme colors - darker shades
      return [
        '#393028', // Base dark brown
        '#4a3d32', // Slightly lighter brown
        '#5b4a3c', // Medium brown
        '#6c5746', // Lighter brown
        '#7d6450', // Light brown
        '#8e715a', // Very light brown
        '#9f7e64', // Tan
        '#b08b6e', // Light tan
        '#c19878', // Very light tan
        '#d2a582', // Cream-tan
      ];
    }
  }, [resolvedTheme]);

  // Note: Authentication is handled by SidebarLayout

  // Fetch monthly report
  const {
    data: monthlyReport,
    isLoading: monthlyLoading,
    error: monthlyError,
    refetch: refetchMonthly
  } = useQuery<MonthlyReportResponse>({
    queryKey: ["monthlyReport", selectedMonth],
    queryFn: () => getMonthlyReport(selectedMonth),
    retry: 2,
  });

  // Fetch yearly report
  const {
    data: yearlyReport,
    isLoading: yearlyLoading,
    error: yearlyError,
    refetch: refetchYearly
  } = useQuery<YearlyReportResponse>({
    queryKey: ["yearlyReport", selectedYear],
    queryFn: () => getYearlyReport(selectedYear),
    retry: 2,
  });

  // Fetch top expenses
  const {
    data: topExpenses,
    isLoading: topExpensesLoading,
    error: topExpensesError,
    refetch: refetchTopExpenses
  } = useQuery<TopExpenseResponse>({
    queryKey: ["topExpenses", selectedMonth],
    queryFn: () => getTopExpenses(selectedMonth, 10),
    retry: 2,
  });

  // Fetch insights
  const {
    data: insights,
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights
  } = useQuery<InsightResponse>({
    queryKey: ["insights", selectedMonth],
    queryFn: () => getInsights(selectedMonth),
    retry: 2,
  });

  // Fetch category-wise report
  const {
    data: categoryReport,
    isLoading: categoryLoading,
    error: categoryError,
    refetch: refetchCategory
  } = useQuery<CategoryWiseMonthlyExpenseResponse>({
    queryKey: ["categoryReport", selectedMonth],
    queryFn: () => getCategoryWiseReport(selectedMonth),
    retry: 2,
  });

  // Fetch categories for additional details
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    refetch: refetchCategories
  } = useQuery<PageCategoryResponse>({
    queryKey: ["categories"],
    queryFn: () => getCategories(0, 50),
    retry: 2,
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prepare yearly chart data
  const yearlyChartData = useMemo(() => {
    if (!yearlyReport) return [];

    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return months.map((month, index) => {
      // The API might use different key formats, let's try multiple formats
      const monthNum = index + 1;
      const monthKey1 = monthNum.toString().padStart(2, '0'); // "08"
      const monthKey2 = monthNum.toString(); // "8"
      const monthKey3 = `${selectedYear}-${monthKey1}`; // "2025-08"
      const monthKey4 = month; // "August"
      const monthKey5 = month.slice(0, 3); // "Aug"

      // Try different key formats to find the data
      const monthData = yearlyReport.monthlyReports[monthKey1] ||
        yearlyReport.monthlyReports[monthKey2] ||
        yearlyReport.monthlyReports[monthKey3] ||
        yearlyReport.monthlyReports[monthKey4] ||
        yearlyReport.monthlyReports[monthKey5] ||
        { budget: 0, totalExpenses: 0, netSavings: 0 };

      return {
        month: month.slice(0, 3),
        budget: monthData.budget || 0,
        expenses: monthData.totalExpenses || 0,
        savings: Math.max(0, monthData.netSavings || 0),
      };
    });
  }, [yearlyReport, selectedYear]);

  // Prepare category pie chart data for interactive chart
  const categoryChartData = useMemo(() => {
    if (!categoryReport) return [];

    return categoryReport.categoryWiseExpenses.map((item, index) => ({
      category: `${item.category.toLowerCase().replace(/\s+/g, '')}-${index}`,
      categoryName: item.category,
      amount: item.amount,
      percentage: item.percentage,
      fill: `var(--color-${item.category.toLowerCase().replace(/\s+/g, '')}-${index})`,
    }));
  }, [categoryReport]);

  // Set active category when data loads
  useEffect(() => {
    if (categoryChartData.length > 0 && activeCategory === "all") {
      // Keep "all" as default, don't auto-select first category
    }
  }, [categoryChartData, activeCategory]);

  // Calculate active index based on selected category and update activeIndex
  useEffect(() => {
    if (categoryChartData.length === 0) {
      setActiveIndex(-1);
      return;
    }

    if (activeCategory === "all") {
      setActiveIndex(-1);
      return;
    }

    const index = categoryChartData.findIndex((item) => item.category === activeCategory);
    setActiveIndex(index >= 0 ? index : -1);
  }, [activeCategory, categoryChartData]);

  // Calculate total category expenses
  const totalCategoryExpenses = useMemo(() => {
    return categoryChartData.reduce((total, item) => total + item.amount, 0);
  }, [categoryChartData]);

  // Chart configurations with theme-aware colors
  const yearlyChartConfig = useMemo(() => {
    const isDark = resolvedTheme === 'dark';
    return {
      budget: {
        label: "Budget",
        color: isDark ? "#60a5fa" : "#2563eb", // Light blue for dark theme, dark blue for light theme
      },
      expenses: {
        label: "Expenses",
        color: isDark ? "#f87171" : "#dc2626", // Light red for dark theme, dark red for light theme
      },
      savings: {
        label: "Savings",
        color: isDark ? "#4ade80" : "#16a34a", // Light green for dark theme, dark green for light theme
      },
    } satisfies ChartConfig;
  }, [resolvedTheme]);

  const categoryChartConfig = useMemo(() => {
    if (!categoryReport) return {};

    const config: ChartConfig = {
      amount: {
        label: "Amount",
      },
    };

    categoryReport.categoryWiseExpenses.forEach((item, index) => {
      const key = `${item.category.toLowerCase().replace(/\s+/g, '')}-${index}`;
      config[key] = {
        label: item.category,
        color: pieChartColors[index % pieChartColors.length],
      };
    });
    return config;
  }, [categoryReport, pieChartColors]);

  // Calculate budget utilization for radial chart
  const budgetUtilization = useMemo(() => {
    if (!monthlyReport) return 0;
    if (monthlyReport.budget === 0) return 0;
    return Math.min(100, (monthlyReport.totalExpenses / monthlyReport.budget) * 100);
  }, [monthlyReport]);

  // Budget radial chart config
  const budgetRadialConfig = useMemo(() => {
    const isDark = resolvedTheme === 'dark';
    return {
      budget: {
        label: "Budget Used",
        color: budgetUtilization > 100
          ? (isDark ? "#f87171" : "#dc2626") // Red for over budget
          : (isDark ? "#60a5fa" : "#2563eb") // Blue for within budget
      }
    } satisfies ChartConfig;
  }, [budgetUtilization, resolvedTheme]);

  // Refresh all data
  const refreshAllData = () => {
    refetchMonthly();
    refetchYearly();
    refetchTopExpenses();
    refetchInsights();
    refetchCategory();
    showSuccess("Analytics data refreshed!");
  };

  const isLoading = monthlyLoading || yearlyLoading || topExpensesLoading || insightsLoading || categoryLoading;
  const hasError = monthlyError || yearlyError || topExpensesError || insightsError || categoryError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive financial insights and spending patterns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={refreshAllData}
            disabled={isLoading}
            className="shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/reports')}
            className="bg-primary hover:bg-primary/90 shadow-sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Date Controls */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <Label htmlFor="month-input" className="text-sm font-medium">
                Month
              </Label>
              <Input
                id="month-input"
                type="month"
                value={selectedMonth.slice(0, 7)}
                onChange={(e) => setSelectedMonth(e.target.value + "-01")}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="year-input" className="text-sm font-medium">
                Year for Trends
              </Label>
              <Input
                id="year-input"
                type="number"
                min="2020"
                max="2030"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {hasError && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load some analytics data. Please try refreshing or check your connection.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-card-foreground">
                {monthlyReport ? formatCurrency(monthlyReport.totalExpenses) : 'N/A'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {format(parseISO(selectedMonth), 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Monthly Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-card-foreground">
                {monthlyReport ? formatCurrency(monthlyReport.budget) : 'N/A'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Budget limit set
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Net Savings</CardTitle>
            {monthlyReport && monthlyReport.netSavings >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className={`text-2xl font-bold ${monthlyReport && monthlyReport.netSavings >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
                }`}>
                {monthlyReport ? formatCurrency(monthlyReport.netSavings) : 'N/A'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {monthlyReport && monthlyReport.netSavings >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Budget Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-card-foreground">
                {budgetUtilization.toFixed(1)}%
              </div>
            )}
            <Progress
              value={budgetUtilization}
              className={`mt-2 ${budgetUtilization > 100 ? 'bg-red-100' : ''}`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Yearly Trends - Highlighted Multiple Bar Chart */}
        <HighlightedMultipleBarChart
          data={yearlyChartData}
          year={selectedYear}
          isLoading={yearlyLoading}
          formatCurrency={formatCurrency}
        />

        {/* Budget Utilization - Enhanced with More Details */}
        <Card className="border-border bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Budget Utilization
            </CardTitle>
            <CardDescription>
              Current month's budget usage breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="space-y-4">
                {/* Central Radial Chart */}
                <div className="flex justify-center">
                  <ChartContainer config={budgetRadialConfig} className="h-[250px] w-[250px]">
                    <RadialBarChart
                      data={[{
                        budget: budgetUtilization,
                        fill: budgetRadialConfig.budget.color,
                      }]}
                      startAngle={90}
                      endAngle={450}
                      innerRadius={75}
                      outerRadius={105}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        dataKey="budget"
                        cornerRadius={10}
                        fill={budgetRadialConfig.budget.color}
                        background={{
                          fill: resolvedTheme === 'dark' ? '#374151' : '#e5e7eb',
                          opacity: 0.3
                        }}
                      />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-bold">
                        {budgetUtilization.toFixed(1)}%
                      </text>
                      <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-sm">
                        Budget Used
                      </text>
                    </RadialBarChart>
                  </ChartContainer>
                </div>

                {/* Budget Details Grid */}
                {monthlyReport && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Spent</p>
                        <p className="text-lg font-bold text-foreground">{formatCurrency(monthlyReport.totalExpenses)}</p>
                      </div>
                      <Wallet className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                        <p className={`text-lg font-bold ${monthlyReport.netSavings >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {formatCurrency(Math.max(0, monthlyReport.budget - monthlyReport.totalExpenses))}
                        </p>
                      </div>
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Budget</p>
                        <p className="text-lg font-bold text-foreground">{formatCurrency(monthlyReport.budget)}</p>
                      </div>
                      <Target className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <p className={`text-sm font-semibold ${budgetUtilization <= 80 ? 'text-green-600' :
                            budgetUtilization <= 100 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                          {budgetUtilization <= 80 ? 'On Track' :
                            budgetUtilization <= 100 ? 'Near Limit' : 'Over Budget'}
                        </p>
                      </div>
                      {budgetUtilization <= 80 ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : budgetUtilization <= 100 ? (
                        <Activity className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown - Interactive Pie Chart */}
        <Card className="border-border bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Category Breakdown
            </CardTitle>
            <CardDescription>
              Interactive expense distribution for {format(parseISO(selectedMonth), 'MMMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <Skeleton className="h-[450px] w-full" />
            ) : categoryChartData.length > 0 ? (
              <div className="space-y-4">
                {/* Category Filter */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Filter by category:</label>
                  <Select value={activeCategory} onValueChange={setActiveCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categoryChartData.map((item, index) => (
                        <SelectItem key={`category-${index}-${item.categoryName}`} value={item.category}>
                          {item.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Interactive Chart */}
                <ChartContainer
                  config={categoryChartConfig}
                  className="mx-auto aspect-square max-h-[400px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={categoryChartData}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={80}
                      outerRadius={140}
                      strokeWidth={5}
                      activeIndex={activeIndex}
                      activeShape={({
                        outerRadius = 0,
                        ...props
                      }: PieSectorDataItem) => (
                        <Sector {...props} outerRadius={outerRadius + 10} />
                      )}
                      onMouseEnter={(_, index) => {
                        // Only change active index on hover if no category is selected from dropdown
                        if (activeCategory === "all") {
                          setActiveIndex(index);
                        }
                      }}
                      onMouseLeave={() => {
                        // Only reset active index if no category is selected from dropdown
                        if (activeCategory === "all") {
                          setActiveIndex(-1);
                        }
                      }}
                      onClick={(_, index) => {
                        // Allow clicking to select a category
                        const clickedCategory = categoryChartData[index];
                        if (clickedCategory) {
                          setActiveCategory(clickedCategory.category);
                        }
                      }}
                    >
                      <RechartsLabel
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            const selectedCategory = activeCategory && activeCategory !== "all"
                              ? categoryChartData.find(item => item.category === activeCategory)
                              : null;

                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-3xl font-bold"
                                >
                                  {selectedCategory
                                    ? formatCurrency(selectedCategory.amount)
                                    : formatCurrency(totalCategoryExpenses)
                                  }
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 24}
                                  className="fill-muted-foreground text-sm"
                                >
                                  {selectedCategory
                                    ? selectedCategory.categoryName
                                    : "Total Expenses"
                                  }
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[450px] text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 font-medium leading-none">
              Interactive Chart · Select from dropdown or click segments
            </div>
            <div className="leading-none text-muted-foreground">
              {categoryChartData.length} categories · {activeCategory && activeCategory !== "all" ? `Showing ${categoryChartData.find(item => item.category === activeCategory)?.categoryName}` : "Hover for details"}
            </div>
          </CardFooter>
        </Card>

        {/* Monthly Insights */}
        <Card className="border-border bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Monthly Insights
            </CardTitle>
            <CardDescription>
              Key spending insights for {format(parseISO(selectedMonth), 'MMMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insightsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : insights ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div>
                    <p className="text-sm font-medium">Most Expensive Day</p>
                    <p className="text-lg font-bold text-primary">{insights.mostExpensiveDay}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold">{formatCurrency(insights.amountOnMostExpensiveDay)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div>
                    <p className="text-sm font-medium">Top Category</p>
                    <p className="text-lg font-bold text-primary">{insights.expensiveCategory}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Spent</p>
                    <p className="text-lg font-bold">{formatCurrency(insights.expensiveCategorySpending)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div>
                    <p className="text-sm font-medium">Daily Average</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(insights.averageDailySpending)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Spending</p>
                    <p className="text-lg font-bold">{formatCurrency(insights.totalSpending)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No insights available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;