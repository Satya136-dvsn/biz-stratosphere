import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { CommandBar } from "./components/layout/CommandBar";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Lazy load all page components for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
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
const MLPredictions = lazy(() => import("./pages/MLPredictions").then(m => ({ default: m.MLPredictions })));
const AutomationRules = lazy(() => import("./pages/AutomationRules"));
const AIComparison = lazy(() => import("./pages/AIComparison").then(m => ({ default: m.AIComparison })));
const Help = lazy(() => import("./pages/Help"));
const PlatformStatus = lazy(() => import("./pages/PlatformStatus"));

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
          <CommandBar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
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
      <BrowserRouter>
        <AppLayout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
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
                    <AIChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ml-predictions"
                element={
                  <ProtectedRoute>
                    <MLPredictions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/automation-rules"
                element={
                  <ProtectedRoute>
                    <AutomationRules />
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
