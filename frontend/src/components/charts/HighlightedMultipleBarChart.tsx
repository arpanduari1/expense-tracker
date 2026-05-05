"use client";

import { Bar, BarChart, XAxis, Cell } from "recharts";
import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface YearlyChartData {
  month: string;
  budget: number;
  expenses: number;
  savings?: number;
}

interface HighlightedMultipleBarChartProps {
  data: YearlyChartData[];
  year: number;
  isLoading?: boolean;
  formatCurrency: (amount: number) => string;
}

const DottedBackgroundPattern = () => {
  return (
    <pattern
      id="yearly-trends-pattern-dots"
      x="0"
      y="0"
      width="10"
      height="10"
      patternUnits="userSpaceOnUse"
    >
      <circle
        className="dark:text-muted/40 text-muted"
        cx="2"
        cy="2"
        r="1"
        fill="currentColor"
      />
    </pattern>
  );
};

export function HighlightedMultipleBarChart({
  data,
  year,
  isLoading = false,
  formatCurrency,
}: HighlightedMultipleBarChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const activeData = React.useMemo(() => {
    if (activeIndex === null) return null;
    return data[activeIndex];
  }, [activeIndex, data]);

  // Calculate year-over-year or month-over-month trend
  const trendPercentage = React.useMemo(() => {
    if (data.length < 2) return 0;
    
    // Filter out months with zero expenses to get actual data
    const monthsWithData = data.filter(d => d.expenses > 0);
    if (monthsWithData.length < 2) return 0;
    
    const lastMonth = monthsWithData[monthsWithData.length - 1];
    const prevMonth = monthsWithData[monthsWithData.length - 2];
    
    if (prevMonth.expenses === 0) return 0;
    
    return ((lastMonth.expenses - prevMonth.expenses) / prevMonth.expenses) * 100;
  }, [data]);

  const isTrendDown = trendPercentage < 0;

  // Get the date range description
  const dateRangeDescription = React.useMemo(() => {
    const monthsWithData = data.filter(d => d.expenses > 0 || d.budget > 0);
    if (monthsWithData.length === 0) return `${year}`;
    
    const firstMonth = monthsWithData[0]?.month || "Jan";
    const lastMonth = monthsWithData[monthsWithData.length - 1]?.month || "Dec";
    
    return `${firstMonth} - ${lastMonth} ${year}`;
  }, [data, year]);

  const chartConfig = {
    budget: {
      label: "Budget",
      color: "var(--chart-1)",
    },
    expenses: {
      label: "Expenses",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  if (isLoading) {
    return (
      <Card className="border-border bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Yearly Spending Trends
          </CardTitle>
          <CardDescription>
            Monthly budget vs expenses for {year}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-border bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Yearly Spending Trends
          </CardTitle>
          <CardDescription>
            Monthly budget vs expenses for {year}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No yearly data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Yearly Spending Trends
          {trendPercentage !== 0 && (
            <Badge
              variant="outline"
              className={`${
                isTrendDown 
                  ? "text-green-500 bg-green-500/10" 
                  : "text-red-500 bg-red-500/10"
              } border-none ml-2`}
            >
              {isTrendDown ? (
                <TrendingDown className="h-4 w-4 mr-1" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-1" />
              )}
              <span>{Math.abs(trendPercentage).toFixed(1)}%</span>
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {activeData ? (
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <span className="font-medium">{activeData.month}</span>
              <span className="text-muted-foreground">
                Budget: <span className="font-semibold text-foreground">{formatCurrency(activeData.budget)}</span>
              </span>
              <span className="text-muted-foreground">
                Expenses: <span className="font-semibold text-foreground">{formatCurrency(activeData.expenses)}</span>
              </span>
            </div>
          ) : (
            <span>{dateRangeDescription}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <rect
              x="0"
              y="0"
              width="100%"
              height="85%"
              fill="url(#yearly-trends-pattern-dots)"
            />
            <defs>
              <DottedBackgroundPattern />
            </defs>
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent 
                  indicator="dashed"
                  formatter={(value, name) => (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground capitalize">{name}:</span>
                      <span className="font-medium">{formatCurrency(value as number)}</span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="budget" fill="var(--color-budget)" radius={4}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-budget-${index}`}
                  fillOpacity={
                    activeIndex === null ? 1 : activeIndex === index ? 1 : 0.3
                  }
                  stroke={activeIndex === index ? "var(--color-budget)" : ""}
                  onMouseEnter={() => setActiveIndex(index)}
                  className="duration-200 transition-all"
                />
              ))}
            </Bar>
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-expenses-${index}`}
                  fillOpacity={
                    activeIndex === null ? 1 : activeIndex === index ? 1 : 0.3
                  }
                  stroke={activeIndex === index ? "var(--color-expenses)" : ""}
                  onMouseEnter={() => setActiveIndex(index)}
                  className="duration-200 transition-all"
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
