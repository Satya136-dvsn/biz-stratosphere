import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { AIChatbot } from "@/components/dashboard/AIChatbot";
import { DataUpload } from "@/components/dashboard/DataUpload";
import { ChurnDataUpload } from "@/components/dashboard/ChurnDataUpload";
import { ChurnPredictionsView } from "@/components/dashboard/ChurnPredictionsView";
import { PredictionsLog } from "@/components/dashboard/PredictionsLog";
import { PredictionForm } from "@/components/dashboard/PredictionForm";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { ExportButtons } from "@/components/dashboard/ExportButtons";
import { ChartTypeSelector, ChartType } from "@/components/dashboard/ChartTypeSelector";
import { MLInsights } from "@/components/dashboard/MLInsights";
import { EnhancedDataUpload } from "@/components/dashboard/EnhancedDataUpload";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TopPerformers } from "@/components/dashboard/TopPerformers";
import { RevenueBreakdown } from "@/components/dashboard/RevenueBreakdown";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { MultiSelectFilter } from "@/components/dashboard/MultiSelectFilter";
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";
import { useRealtimeKPIs } from "@/hooks/useRealtimeKPIs";
import { subMonths } from 'date-fns';
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { user } = useAuth();
  // Fix: Destructure 'data' as 'kpiData' because useQuery returns 'data'
  const { data: kpiData, isLoading } = useKPIData();
  const { realtimeData } = useRealtimeKPIs();

  // Chart filters state
  const [startDate, setStartDate] = useState(() => subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState(() => new Date());
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [revenueChartType, setRevenueChartType] = useState<ChartType>('line');
  const [customerChartType, setCustomerChartType] = useState<ChartType>('bar');

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
    period
  });

  return (
    <div id="dashboard-content" className="min-h-screen">
      <main className="p-6 space-y-8 animate-fade-in-up">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
            Business Intelligence Dashboard
          </h2>
          <p className="text-muted-foreground text-lg font-medium">
            AI-powered insights and analytics for data-driven decisions
          </p>
        </div>

        {/* KPI Cards Grid - Enhanced with animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Enhanced loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 glass rounded-xl animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
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
              <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <KPICard
                  title="Active Customers"
                  value={kpiData?.activeCustomers || 0}
                  change={kpiData?.customersChange || 0}
                  format="number"
                  variant="growth"
                />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <KPICard
                  title="Churn Rate"
                  value={kpiData?.churnRate || 0}
                  change={kpiData?.churnChange || 0}
                  format="percentage"
                  variant="warning"
                />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <KPICard
                  title="Avg Deal Size"
                  value={kpiData?.averageDealSize || 0}
                  change={kpiData?.dealSizeChange || 0}
                  format="currency"
                  variant="info"
                />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <KPICard
                  title="Conversion Rate"
                  value={kpiData?.conversionRate || 0}
                  change={kpiData?.conversionChange || 0}
                  format="percentage"
                  variant="growth"
                />
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
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

        {/* Advanced Filters Section - Enhanced */}
        <div className="glass-strong rounded-xl p-6 space-y-4 hover-lift">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
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


        {/* Charts Section - Enhanced with better spacing */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
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

            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '700ms' }}>
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

        {/* AI Assistant & Tools Section - Enhanced spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '800ms' }}>
            <AIChatbot />
          </div>
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '900ms' }}>
            <ExportButtons
              kpiData={kpiData}
              chartData={chartData}
              dashboardElementId="dashboard-content"
            />
            <MLInsights />
          </div>
        </div>

        {/* Data Upload Section - Enhanced */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DataUpload />
          <ChurnDataUpload />
          <EnhancedDataUpload />
        </div>

        {/* Business Insights Section - Better spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity />
          <QuickActions />
        </div>

        {/* Analytics Section - Enhanced layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          <TopPerformers />
          <RevenueBreakdown />
        </div>

        {/* Predictions Section - Hidden per user request */}
        {/* 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PredictionForm />
          <PredictionsLog />
        </div>
        */}

        {/* Churn Predictions Analysis - Hidden per user request */}
        {/*
        <div>
          <ChurnPredictionsView />
        </div>
        */}
      </main>
    </div>
  );
}