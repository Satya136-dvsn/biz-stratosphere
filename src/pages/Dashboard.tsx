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
import { Upload, Filter, SlidersHorizontal } from "lucide-react";

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      <div className="text-center">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
          {title}
        </h3>
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
    </div>
  );
}

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.user_metadata?.display_name?.split(' ')[0] || "there";

  return (
    <div id="dashboard-content" className="min-h-screen">
      <main className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">

        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {getGreeting()}, {firstName}
            </h2>
            <p className="text-sm text-muted-foreground/60 mt-0.5">
              Here's what's happening with your business today
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DemoModeTrigger onClick={() => setShowDemoTour(true)} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 h-8 text-xs border-border/50 text-muted-foreground hover:text-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="sm"
                  className="gap-2 h-8 text-xs bg-primary hover:bg-primary/90 text-white"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Manage Data</span>
                  <span className="sm:hidden">Data</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-[hsl(220_18%_7%)] border-[hsl(220_16%_12%)]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-foreground">
                    <Upload className="h-5 w-5 text-primary" />
                    Data Manager
                  </SheetTitle>
                  <SheetDescription className="text-muted-foreground/60">
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

        {/* ─── KPI Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl skeleton-shimmer" />
            ))
          ) : (
            <>
              <KPICard title="Total Revenue" value={kpiData?.totalRevenue || 0} change={kpiData?.revenueChange || 0} format="currency" variant="revenue" />
              <KPICard title="Active Customers" value={kpiData?.activeCustomers || 0} change={kpiData?.customersChange || 0} format="number" variant="growth" />
              <KPICard title="Churn Rate" value={kpiData?.churnRate || 0} change={kpiData?.churnChange || 0} format="percentage" variant="warning" />
              <KPICard title="Avg Deal Size" value={kpiData?.averageDealSize || 0} change={kpiData?.dealSizeChange || 0} format="currency" variant="info" />
              <KPICard title="Conversion Rate" value={kpiData?.conversionRate || 0} change={kpiData?.conversionChange || 0} format="percentage" variant="growth" />
              <KPICard title="Growth Rate" value={kpiData?.growthRate || 0} change={kpiData?.growthChange || 0} format="percentage" variant="revenue" />
            </>
          )}
        </div>

        {/* Welcome Card for New Users */}
        {!isLoading && kpiData && kpiData.totalRevenue === 0 && kpiData.activeCustomers === 0 && (
          <WelcomeCard />
        )}

        {/* ─── Filters (collapsible) ─── */}
        {showFilters && (
          <div className="rounded-xl border border-[hsl(220_16%_14%)] bg-[hsl(220_18%_7%)] p-5 space-y-4 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              Chart Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

        {/* ─── Charts ─── */}
        <div>
          <SectionHeader title="Analytics" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
            <div className="space-y-3">
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
            <div className="space-y-3">
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
        </div>

        {/* ─── AI & ML ─── */}
        <div>
          <SectionHeader title="AI Intelligence" />
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mt-4">
            <div className="xl:col-span-3" data-testid="ai-chatbot">
              <AIChatbot />
            </div>
            <div className="xl:col-span-2 space-y-4" data-testid="ml-insights">
              <ExportButtons
                kpiData={kpiData}
                chartData={chartData}
                dashboardElementId="dashboard-content"
              />
              <MLInsights />
            </div>
          </div>
        </div>

        {/* ─── Business Activity ─── */}
        <div>
          <SectionHeader title="Business Activity" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <RecentActivity />
            <QuickActions />
            <DecisionMemoryHighlight />
          </div>
        </div>

        {/* ─── Performance ─── */}
        <div className="pb-8">
          <SectionHeader title="Performance" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <TopPerformers />
            <RevenueBreakdown />
          </div>
        </div>
      </main>

      {/* Guided Demo Tour Overlay */}
      <GuidedDemoMode isActive={showDemoTour} onClose={() => setShowDemoTour(false)} />
    </div>
  );
}