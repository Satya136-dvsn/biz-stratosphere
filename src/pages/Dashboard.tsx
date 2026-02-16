// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { useState } from "react";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { AIChatbot } from "@/components/dashboard/AIChatbot";
import { DataUpload } from "@/components/dashboard/DataUpload";
import { ChurnDataUpload } from "@/components/dashboard/ChurnDataUpload";
import { EnhancedDataUpload } from "@/components/dashboard/EnhancedDataUpload";
import { ChartTypeSelector, ChartType } from "@/components/dashboard/ChartTypeSelector";
import { MLInsights } from "@/components/dashboard/MLInsights";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TopPerformers } from "@/components/dashboard/TopPerformers";
import { RevenueBreakdown } from "@/components/dashboard/RevenueBreakdown";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { MultiSelectFilter } from "@/components/dashboard/MultiSelectFilter";
import { ExportButtons } from "@/components/dashboard/ExportButtons";
import { GuidedDemoMode, DemoModeTrigger } from "@/components/demo/GuidedDemoMode";
import { DecisionMemoryHighlight } from "@/components/demo/DecisionMemoryHighlight";
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";
import { useRealtimeKPIs } from "@/hooks/useRealtimeKPIs";
import { subMonths } from 'date-fns';
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Upload, Filter, Brain } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: kpiData, isLoading } = useKPIData();
  const { realtimeData } = useRealtimeKPIs();

  // Chart filters state
  const [startDate, setStartDate] = useState<Date | undefined>(() => subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [revenueChartType, setRevenueChartType] = useState<ChartType>('line');
  const [customerChartType, setCustomerChartType] = useState<ChartType>('bar');
  const [showFilters, setShowFilters] = useState(false);
  const [showDemoTour, setShowDemoTour] = useState(false);

  const availableCategories = [
    { label: 'Revenue', value: 'revenue' },
    { label: 'Customers', value: 'customers' },
    { label: 'Sales', value: 'sales' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Operations', value: 'operations' },
  ];

  const { chartData, isLoading: isChartLoading, isFiltering } = useChartData({
    startDate,
    endDate,
    period,
    categories: selectedCategories
  });

  return (
    <div id="dashboard-content" className="min-h-screen">
      <main className="p-6 space-y-8">
        {/* ── Header Section ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <h2 className="text-4xl font-bold mb-1 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
              Business Intelligence Dashboard
            </h2>
            <p className="text-muted-foreground text-lg font-medium">
              AI-powered insights and analytics for data-driven decisions
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <DemoModeTrigger onClick={() => setShowDemoTour(true)} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>

            {/* Data Manager Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md hover:shadow-lg transition-all">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Manage Data</span>
                  <span className="sm:hidden">Data</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Data Manager
                  </SheetTitle>
                  <SheetDescription>
                    Upload, manage, and process your business data.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <DataUpload />
                  <ChurnDataUpload />
                  <EnhancedDataUpload />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* ── KPI Cards Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-xl skeleton-shimmer"
              />
            ))
          ) : (
            <>
              <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
                <KPICard
                  title="Total Revenue"
                  value={kpiData?.totalRevenue || 0}
                  change={kpiData?.revenueChange || 0}
                  format="currency"
                  variant="revenue"
                />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
                <KPICard
                  title="Active Customers"
                  value={kpiData?.activeCustomers || 0}
                  change={kpiData?.customersChange || 0}
                  format="number"
                  variant="growth"
                />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '160ms' }}>
                <KPICard
                  title="Churn Rate"
                  value={kpiData?.churnRate || 0}
                  change={kpiData?.churnChange || 0}
                  format="percentage"
                  variant="warning"
                />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '240ms' }}>
                <KPICard
                  title="Avg Deal Size"
                  value={kpiData?.averageDealSize || 0}
                  change={kpiData?.dealSizeChange || 0}
                  format="currency"
                  variant="info"
                />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '320ms' }}>
                <KPICard
                  title="Conversion Rate"
                  value={kpiData?.conversionRate || 0}
                  change={kpiData?.conversionChange || 0}
                  format="percentage"
                  variant="growth"
                />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <KPICard
                  title="Growth Rate"
                  value={kpiData?.growthRate || 0}
                  change={kpiData?.growthChange || 0}
                  format="percentage"
                  variant="revenue"
                />
              </div>
            </>
          )}
        </div>

        {/* Welcome Card for New Users */}
        {!isLoading && kpiData && kpiData.totalRevenue === 0 && kpiData.activeCustomers === 0 && (
          <WelcomeCard />
        )}

        {/* ── Collapsible Filters ────────────────────────────── */}
        {showFilters && (
          <div className="glass-strong rounded-xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
              <MultiSelectFilter
                options={availableCategories}
                selected={selectedCategories}
                onSelectionChange={setSelectedCategories}
                placeholder="Filter by category..."
                label="Categories"
              />
            </div>
          </div>
        )}

        {/* ── Charts Section ─────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <ChartTypeSelector
              selectedType={revenueChartType}
              onTypeChange={setRevenueChartType}
              availableTypes={['line', 'area', 'bar']}
            />
            <RevenueChart
              title="Revenue vs Target"
              variant={revenueChartType}
              data={chartData}
              isLoading={isChartLoading}
              isFiltering={isFiltering}
              metric="revenue"
            />
          </div>

          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <ChartTypeSelector
              selectedType={customerChartType}
              onTypeChange={setCustomerChartType}
              availableTypes={['bar', 'line', 'pie']}
            />
            <RevenueChart
              title="Customer Analytics"
              variant={customerChartType}
              data={chartData}
              isLoading={isChartLoading}
              isFiltering={isFiltering}
              metric="customers"
            />
          </div>
        </div>

        {/* ── AI & ML Section ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '700ms' }} data-testid="ai-chatbot">
            <AIChatbot />
          </div>
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '800ms' }} data-testid="ml-insights">
            <ExportButtons
              kpiData={kpiData}
              chartData={chartData}
              dashboardElementId="dashboard-content"
            />
            <MLInsights />
          </div>
        </div>

        {/* ── Business Insights ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentActivity />
          <QuickActions />
          <DecisionMemoryHighlight />
        </div>

        {/* ── Analytics Details ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          <TopPerformers />
          <RevenueBreakdown />
        </div>
      </main>

      {/* Guided Demo Tour Overlay */}
      <GuidedDemoMode isActive={showDemoTour} onClose={() => setShowDemoTour(false)} />
    </div>
  );
}