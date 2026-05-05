import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Palette, Zap, User, Lock } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { performLogout } from "@/utils/logout";

const Settings = () => {
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    performLogout(queryClient, navigate);
    showSuccess("Logged out successfully!");
  };

  return (
    <div className="max-w-8xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your application settings here.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
        
        {/* Theme Settings - Small Card */}
        <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </CardTitle>
            <CardDescription className="text-sm">
              Switch between light and dark themes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Theme</Label>
                <p className="text-xs text-muted-foreground">
                  Currently: <span className="font-medium capitalize">{resolvedTheme}</span>
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Small Card */}
        <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-sm">
              Frequently used actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleLogout}
              className="w-full flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Account Info - Small Card */}
        <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Account
            </CardTitle>
            <CardDescription className="text-sm">
              Your account information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Theme:</span>
                <span className="font-medium capitalize">{resolvedTheme}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password - Small Card */}
        <Card className="border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Change Password
            </CardTitle>
            <CardDescription className="text-sm">
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ChangePasswordDialog 
              trigger={
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Change Password
                </Button>
              } 
            />
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Settings;