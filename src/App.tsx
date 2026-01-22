import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { CommandBar } from "./components/layout/CommandBar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { MainContent } from "./components/layout/MainContent";
import { MobileNav } from "./components/layout/MobileNav";

// Lazy load all page components for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Landing = lazy(() => import("./pages/Landing"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Enterprise = lazy(() => import("./pages/Enterprise").then(m => ({ default: m.Enterprise })));
const Reports = lazy(() => import("./pages/Reports").then(m => ({ default: m.Reports })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const Workspaces = lazy(() => import("./pages/Workspaces"));
const APIManagement = lazy(() => import("./pages/APIManagement"));
const AdvancedCharts = lazy(() => import("./pages/AdvancedCharts"));
const AIChat = lazy(() => import("./pages/AIChat").then(m => ({ default: m.AIChat })));
const AIAnalytics = lazy(() => import("./pages/AIAnalytics").then(m => ({ default: m.AIAnalytics })));
const MLPredictions = lazy(() => import("./pages/MLPredictions").then(m => ({ default: m.MLPredictions })));
const AutomationRules = lazy(() => import("./pages/AutomationRules"));
const AIComparison = lazy(() => import("./pages/AIComparison").then(m => ({ default: m.AIComparison })));
const Help = lazy(() => import("./pages/Help"));
const PlatformStatus = lazy(() => import("./pages/PlatformStatus"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const UserManagement = lazy(() => import("./pages/admin/UserManagement").then(m => ({ default: m.UserManagement })));
const AIControl = lazy(() => import("./pages/admin/AIControl").then(m => ({ default: m.AIControl })));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs").then(m => ({ default: m.AuditLogs })));
const AIDecisionAudit = lazy(() => import("./pages/admin/AIDecisionAudit"));
const UploadHistory = lazy(() => import("./pages/UploadHistory").then(m => ({ default: m.UploadHistory })));
const SystemMonitor = lazy(() => import("./pages/SystemMonitor"));
const StreamingETL = lazy(() => import("./pages/StreamingETL"));
import { AdminRoute } from "./components/AdminRoute";

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

// Layout component that includes sidebar for protected pages
function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';
  const isLandingPage = location.pathname === '/';

  if (isAuthPage || isLandingPage) {
    return (
      <div className="min-h-screen bg-gradient-bg">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center border-b border-border/50">
            <MobileNav />
            <div className="flex-1">
              <CommandBar />
            </div>
          </div>
          <MainContent>
            {children}
          </MainContent>
        </div>
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppLayout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<Landing />} />
              <Route path="/platform-status" element={<PlatformStatus />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/enterprise"
                element={
                  <ProtectedRoute>
                    <Enterprise />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspaces"
                element={
                  <ProtectedRoute>
                    <Workspaces />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/api-management"
                element={
                  <ProtectedRoute>
                    <APIManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/advanced-charts"
                element={
                  <ProtectedRoute>
                    <AdvancedCharts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-chat"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <AIChat />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-analytics"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <AIAnalytics />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ml-predictions"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <MLPredictions />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/automation-rules"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <AutomationRules />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-comparison"
                element={
                  <ProtectedRoute>
                    <AIComparison />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <ProtectedRoute>
                    <Help />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload-history"
                element={
                  <ProtectedRoute>
                    <UploadHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system-monitor"
                element={
                  <ProtectedRoute>
                    <SystemMonitor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/streaming-etl"
                element={
                  <ProtectedRoute>
                    <StreamingETL />
                  </ProtectedRoute>
                }
              />



              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <UserManagement />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/ai"
                element={
                  <AdminRoute>
                    <AIControl />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/security"
                element={
                  <AdminRoute>
                    <AuditLogs />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/ai-audit"
                element={
                  <AdminRoute>
                    <AIDecisionAudit />
                  </AdminRoute>
                }
              />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
