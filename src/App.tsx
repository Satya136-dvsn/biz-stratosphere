import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { CommandBar } from "./components/layout/CommandBar";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import { Enterprise } from "./pages/Enterprise";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Profile } from "./pages/Profile";
import Workspaces from "./pages/Workspaces";
import APIManagement from "./pages/APIManagement";
import AdvancedCharts from "./pages/AdvancedCharts";
import { AIChat } from "./pages/AIChat";
import { MLPredictions } from "./pages/MLPredictions";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Landing />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
