import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Onboarding from "./pages/Onboarding";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function FullscreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function ProtectedRoute({ children, requireOnboarded = true }: { children: React.ReactNode; requireOnboarded?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const { tenant, onboarded, loading: tenantLoading } = useTenant();

  if (authLoading) return <FullscreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (tenantLoading) return <FullscreenLoader />;

  if (requireOnboarded && (!tenant || !onboarded)) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenLoader />;
  if (user) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/cadastro" element={<PublicRoute><Cadastro /></PublicRoute>} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute requireOnboarded={false}>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
