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
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";
import { subMonths } from 'date-fns';

export default function Dashboard() {
  const { kpiData, isLoading } = useKPIData();
  
  // Chart filters state
  const [startDate, setStartDate] = useState(() => subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState(() => new Date());
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [revenueChartType, setRevenueChartType] = useState<ChartType>('line');
  const [customerChartType, setCustomerChartType] = useState<ChartType>('bar');
  
  const availableCategories = ['Revenue', 'Customers', 'Sales', 'Marketing', 'Operations'];
  
  const { chartData, isLoading: isChartLoading } = useChartData({
    startDate,
    endDate,
    period
  });

  return (
    <div id="dashboard-content">
      <main className="p-6 space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Business Intelligence Dashboard
          </h2>
          <p className="text-muted-foreground text-lg">
            AI-powered insights and analytics for data-driven decisions
          </p>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-card/50 rounded-lg animate-pulse" />
            ))
          ) : (
            <>
              <KPICard
                title="Total Revenue"
                value={kpiData?.totalRevenue || 0}
                change={kpiData?.revenueChange || 0}
                format="currency"
                variant="revenue"
              />
              <KPICard
                title="Active Customers"
                value={kpiData?.activeCustomers || 0}
                change={kpiData?.customersChange || 0}
                format="number"
                variant="growth"
              />
              <KPICard
                title="Churn Rate"
                value={kpiData?.churnRate || 0}
                change={kpiData?.churnChange || 0}
                format="percentage"
                variant="warning"
              />
              <KPICard
                title="Avg Deal Size"
                value={kpiData?.averageDealSize || 0}
                change={kpiData?.dealSizeChange || 0}
                format="currency"
                variant="info"
              />
            </>
          )}
        </div>

        {/* Enhanced Filters */}
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          period={period}
          selectedCategories={selectedCategories}
          availableCategories={availableCategories}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onPeriodChange={setPeriod}
          onCategoryChange={setSelectedCategories}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Charts Section */}
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-4">
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
                />
              </div>
              
              <div className="space-y-4">
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
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ExportButtons 
              kpiData={kpiData}
              chartData={chartData}
              dashboardElementId="dashboard-content"
            />
            <MLInsights />
            <AIChatbot />
          </div>
        </div>

        {/* Data Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DataUpload />
          <ChurnDataUpload />
        </div>

        {/* Predictions Section */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PredictionForm />
          <div className="lg:col-span-1">
            <PredictionsLog />
          </div>
          </div>
        </div>

        {/* Churn Predictions Analysis */}
        <div>
          <ChurnPredictionsView />
        </div>
      </main>
    </div>
  );
}