import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "@/services/authService";
import { showError, showSuccess } from "@/utils/toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ResetPasswordRequest } from "@/types";
import { StaticLogo } from "@/components/StaticLogo";

const formSchema = z
  .object({
    newPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSuccess, setIsSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const token = searchParams.get("token");
  const idParam = searchParams.get("id");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Validate that we have the required parameters
    if (!token || !idParam) {
      setInvalidToken(true);
    }
  }, [token, idParam]);

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordRequest) => resetPassword(data),
    onSuccess: (data) => {
      showSuccess("Password has been reset successfully!");
      setIsSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    },
    onError: (error: any) => {
      console.error('Reset password error:', error);
      let errorMessage = "Failed to reset password. Please try again.";
      
      if (error.response?.status === 400) {
        errorMessage = "Invalid or expired reset token. Please request a new password reset.";
      } else if (error.response?.status === 404) {
        errorMessage = "Reset token not found. Please request a new password reset.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      showError(errorMessage);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!token || !idParam) {
      showError("Invalid reset link. Please request a new password reset.");
      return;
    }

    const resetData: ResetPasswordRequest = {
      id: parseInt(idParam),
      token: token,
      newPassword: values.newPassword,
    };

    mutation.mutate(resetData);
  };

  if (invalidToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f9f9f9] light">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <StaticLogo className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#202020]">Invalid Reset Link</CardTitle>
            <CardDescription className="text-[#646464]">
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Please request a new password reset link to continue.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col space-y-2">
              <Button className="w-full bg-[#644a40] hover:bg-[#582d1d] text-white" asChild>
                <Link to="/forgot-password">Request New Reset Link</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login">Back to Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f9f9f9] light">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <StaticLogo className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#202020]">Password Reset Successful</CardTitle>
            <CardDescription className="text-[#646464]">
              Your password has been reset successfully. You will be redirected to the login page shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                You can now sign in with your new password.
              </AlertDescription>
            </Alert>
            <Button className="w-full bg-[#644a40] hover:bg-[#582d1d] text-white" asChild>
              <Link to="/login">Go to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f9f9f9] light">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <StaticLogo className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#202020]">Reset Password</CardTitle>
          <CardDescription className="text-[#646464]">
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your new password"
                        {...field}
                        className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-[#644a40] focus:ring-[#644a40]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your new password"
                        {...field}
                        className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-[#644a40] focus:ring-[#644a40]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full bg-[#644a40] hover:bg-[#582d1d] text-white"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login">Back to Sign In</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
