import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  CreditCard,
  Calendar,
  Tags,
  CircleDollarSign,
  BarChart,
  FileBarChart,
  Settings,
  Menu,
  X,
  User,
  ChevronLeft,
  ChevronRight,
  BookUser,
} from "lucide-react";
import { DynamicLogo } from "@/components/DynamicLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { getUser } from "@/services/userService";
import { isTokenExpired } from "@/utils/tokenUtils";
import { performLogout } from "@/utils/logout";
import { getAuthToken, getRefreshToken } from "@/utils/tokenStorage";
import { tokenRefreshService } from "@/services/tokenRefreshService";
import ExpenseWiseLogo from "@/assets/Logo-Assets/ExpenseWise.png";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/expenses", icon: CreditCard, label: "Expenses" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/categories", icon: Tags, label: "Categories" },
  { to: "/budget", icon: CircleDollarSign, label: "Budget" },
  { to: "/ledger", icon: BookUser, label: "Ledger" },
  { to: "/analytics", icon: BarChart, label: "Analytics" },
  { to: "/reports", icon: FileBarChart, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const SidebarLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Authentication check - try to refresh token if access token is missing/expired
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      const refreshTokenValue = getRefreshToken();

      // If we have a valid access token, we're good
      if (token && !isTokenExpired(token)) {
        setIsAuthChecking(false);
        return;
      }

      // If access token is missing or expired, but we have a refresh token, try to refresh
      if (refreshTokenValue) {
        console.log("Access token missing/expired, attempting to refresh...");
        try {
          const success = await tokenRefreshService.checkAndRefreshIfNeeded();
          if (success) {
            console.log("Token refresh successful");
            setIsAuthChecking(false);
            return;
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
        }
      }

      // No valid tokens, redirect to login
      console.log("No valid tokens, redirecting to login");
      performLogout(queryClient, navigate);
    };

    checkAuth();
  }, [navigate, queryClient]);

  // Fetch user profile (only when auth check is complete)
  const { data: user } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
    enabled: !isAuthChecking, // Only fetch when auth check is complete
  });

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setIsMobileOpen(false);
        setIsCollapsed(false); // Reset collapse state on mobile
      }
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === '\\') {
        event.preventDefault();
        if (!isMobile) {
          toggleSidebar();
        }
      }
      if (event.key === 'Escape' && isMobileOpen && isMobile) {
        setIsMobileOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Show loading state while checking authentication
  if (isAuthChecking) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background relative">
      {/* Fixed Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col shadow-xl backdrop-blur-sm transition-all duration-300 ease-in-out",
          // Desktop behavior - show collapsed or expanded
          !isMobile && (isCollapsed ? "w-16" : "w-64"),
          // Mobile behavior - show/hide completely
          isMobile && (isMobileOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full")
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "border-b border-sidebar-border bg-sidebar/95 backdrop-blur-sm transition-all duration-300 relative",
          isCollapsed && !isMobile ? "p-3 h-[88px]" : "p-6"
        )}>
          {/* Logo - full logo when expanded, small logo when collapsed */}
          {!isCollapsed || isMobile ? (
            <div className="flex items-center justify-between h-16">
              <DynamicLogo className="h-12 w-auto max-w-[200px] flex-shrink-0" />
              {/* Mobile close button */}
              {isMobile && isMobileOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-8 w-8 hover:bg-sidebar-accent/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full min-h-[64px]">
              <img
                src={ExpenseWiseLogo}
                alt="ExpenseWise"
                className="h-8 w-8 object-contain"
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden bg-sidebar sidebar-scrollbar">
          <div className="px-2">
            <ul className="space-y-1">
              {/* Collapse/Expand Button as Navigation Item */}
              <li>
                <button
                  onClick={toggleSidebar}
                  className={cn(
                    "w-full flex items-center rounded-lg transition-all duration-300 ease-in-out text-sm font-medium group relative hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                    isCollapsed && !isMobile
                      ? "px-0 py-3 justify-center w-12 h-12 mx-auto"
                      : "px-4 py-3"
                  )}
                  title={isCollapsed && !isMobile ? (isCollapsed ? "Expand sidebar" : "Collapse sidebar") : undefined}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-5 h-5 flex-shrink-0 transition-all duration-300 ease-in-out" />
                  ) : (
                    <ChevronLeft className="w-5 h-5 mr-3 flex-shrink-0 transition-all duration-300 ease-in-out" />
                  )}
                  <span className={cn(
                    "transition-all duration-300 ease-in-out whitespace-nowrap",
                    isCollapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                  )}>
                    {isCollapsed ? "Expand" : "Collapse"}
                  </span>

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && !isMobile && (
                    <div className="sidebar-tooltip">
                      Expand sidebar
                    </div>
                  )}
                </button>
              </li>

              {/* Regular Navigation Items */}
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={() => isMobile && setIsMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center rounded-lg transition-all duration-300 ease-in-out text-sm font-medium group relative",
                        isCollapsed && !isMobile
                          ? "px-0 py-3 justify-center w-12 h-12 mx-auto"
                          : "px-4 py-3",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )
                    }
                    title={isCollapsed && !isMobile ? item.label : undefined}
                  >
                    <item.icon className={cn(
                      "flex-shrink-0 transition-all duration-300 ease-in-out",
                      isCollapsed && !isMobile ? "w-5 h-5" : "w-5 h-5 mr-3"
                    )} />
                    <span className={cn(
                      "transition-all duration-300 ease-in-out whitespace-nowrap",
                      isCollapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                    )}>
                      {item.label}
                    </span>

                    {/* Tooltip for collapsed state */}
                    {isCollapsed && !isMobile && (
                      <div className="sidebar-tooltip">
                        {item.label}
                      </div>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className={cn(
          "border-t border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
          isCollapsed && !isMobile ? "p-2" : "p-4"
        )}>
          <NavLink
            to="/profile"
            onClick={() => isMobile && setIsMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded-lg transition-all duration-300 ease-in-out group relative",
                isCollapsed && !isMobile
                  ? "p-2 justify-center w-12 h-12 mx-auto"
                  : "gap-3 p-2",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )
            }
            title={isCollapsed && !isMobile ? user?.username || "Profile" : undefined}
          >
            <UserAvatar
              key={`sidebar-avatar-${user?.avatarUrl || 'no-avatar'}`}
              src={user?.avatarUrl}
              username={user?.username || "User"}
              size={isCollapsed && !isMobile ? 28 : 40}
              className="flex-shrink-0 transition-all duration-300 ease-in-out"
            />
            <div className={cn(
              "min-w-0 flex-1 transition-all duration-300 ease-in-out",
              isCollapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}>
              <p className="text-sm font-semibold truncate">{user?.username || "Loading..."}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
            </div>
            <User className={cn(
              "h-4 w-4 flex-shrink-0 transition-all duration-300 ease-in-out",
              isCollapsed && !isMobile ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )} />

            {/* Tooltip for collapsed profile */}
            {isCollapsed && !isMobile && (
              <div className="sidebar-tooltip">
                {user?.username || "Profile"}
              </div>
            )}
          </NavLink>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-6 left-4 z-[60] shadow-lg hover:shadow-xl bg-background border-2 h-10 w-10 hover:scale-105"
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
        >
          <div className="transition-transform duration-200">
            {isMobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </div>
        </Button>
      )}

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen transition-all duration-300 ease-in-out",
          !isMobile && (isCollapsed ? "ml-16" : "ml-64"),
          isMobile && "ml-0"
        )}
      >
        <div className="p-6 pt-6 h-screen overflow-y-auto custom-scrollbar smooth-scroll">
          <Outlet />
        </div>
      </main>

      {/* Overlay for mobile */}
      {isMobileOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </div>
  );
};

export default SidebarLayout;