import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { tokenRefreshService } from "@/services/tokenRefreshService";
import { isTokenExpired } from "@/utils/tokenUtils";
import NotFound from "./pages/NotFound";
import SidebarLayout from "./layouts/SidebarLayout";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Calendar from "./pages/Calendar";
import Categories from "./pages/Categories";
import Budget from "./pages/Budget";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports.tsx";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Ledger from "./pages/Ledger";
import LedgerDetail from "./pages/LedgerDetail";
import SplashScreen from "./pages/SplashScreen";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyAccount from "./pages/VerifyAccount";
import LandingPage from "./pages/LandingPage";
import OAuthSuccess from "./pages/OAuthSuccess";

const queryClient = new QueryClient();

// Component to handle token monitoring
const TokenMonitor = () => {
  const location = useLocation();

  useEffect(() => {
    // Start token monitoring when the app loads
    const token = localStorage.getItem("authToken");

    // Only start monitoring if we have a VALID (non-expired) token and we're on a protected route.
    // If the token is expired, SidebarLayout's auth check will handle the refresh first
    // to avoid a race condition between TokenMonitor and SidebarLayout both trying to refresh.
    if (token && !isTokenExpired(token) && !isPublicRoute(location.pathname)) {
      tokenRefreshService.startTokenMonitoring();
    } else if (isPublicRoute(location.pathname)) {
      tokenRefreshService.stopTokenMonitoring();
    }

    // Cleanup on unmount
    return () => {
      tokenRefreshService.stopTokenMonitoring();
    };
  }, [location.pathname]);

  return null;
};

// Helper function to determine if a route is public
const isPublicRoute = (pathname: string): boolean => {
  const publicRoutes = [
    '/',
    '/splash',
    '/onboarding',
    '/login',
    '/create-account',
    '/forgot-password',
    '/reset-password',
    '/verify-account',
    '/oauth-success'
  ];
  return publicRoutes.includes(pathname);
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <TokenMonitor />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/splash" element={<SplashScreen />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-account" element={<VerifyAccount />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            <Route element={<SidebarLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/ledger" element={<Ledger />} />
              <Route path="/ledger/:id" element={<LedgerDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;