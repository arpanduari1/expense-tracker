import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { StaticLogo } from "@/components/StaticLogo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "@/services/authService";
import { showError, showSuccess } from "@/utils/toast";
import { isTokenExpired } from "@/utils/tokenUtils";

const formSchema = z.object({
  userIdentifier: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
  rememberMe: z.boolean().default(false),
});

const Login = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect already-authenticated users to dashboard
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const refreshTokenValue = localStorage.getItem("refreshToken");

    if ((token && !isTokenExpired(token)) || refreshTokenValue) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userIdentifier: "",
      password: "",
      rememberMe: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (credentials: any) => login(credentials),
    onSuccess: (data) => {
      console.log('Login response data:', data);

      // Clear all cached data from previous user
      queryClient.clear();

      // Invalidate specific user-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });

      showSuccess("Login successful!");
      // Token storage is already handled in authService.login
      navigate("/dashboard");
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      let errorMessage = "Login failed. Please try again.";

      if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
        errorMessage = "Unable to connect to the server. Please check if the backend is running.";
      } else if (error.response?.status === 401) {
        errorMessage = "Invalid username or password.";
      } else if (error.response?.status === 403) {
        errorMessage = "Account not verified. Please check your email for verification instructions.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      showError(errorMessage);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Logging in with:", values);
    mutation.mutate({
      userIdentifier: values.userIdentifier,
      password: values.password
    });
  };

  return (
    <div className="min-h-screen bg-[#C7BFBF] flex items-center justify-center p-4 light">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-7xl w-full">
        <div className="grid lg:grid-cols-2 min-h-[700px]">
          {/* Left side - Logo and branding */}
          <div className="bg-[#393028] flex flex-col items-center justify-center p-20">
            <div className="text-center">
              <div className="mb-8">
                <StaticLogo className="h-20 mx-auto mb-6" />
                {/* <h1 className="text-3xl font-bold text-black mb-2">ExpenseWise</h1>
                <p className="text-lg text-black/80">Smart Expense Tracking</p> */}
              </div>
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="flex items-center justify-center p-20">
            <div className="w-full max-w-lg space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">Sign in to your account</h1>
                <p className="text-gray-600">
                  Enter your username below
                  <br />
                  to login to your account
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="userIdentifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your username"
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
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Password</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="••••••••"
                            {...field}
                            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-[#644a40] focus:ring-[#644a40]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-gray-300 data-[state=checked]:bg-[#644a40] data-[state=checked]:border-[#644a40]"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Remember me
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-[#8B7355] hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#644a40] hover:bg-[#582d1d] text-white border-0"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? "Signing in..." : "Sign in"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-4 text-gray-500">or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-gray-300 bg-white text-gray-900 hover:bg-gray-50 flex items-center justify-center gap-3"
                    onClick={() => {
                      // Get base URL from environment and strip /api/v1 suffix for OAuth endpoint
                      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string || "";
                      const oauthBaseUrl = apiBaseUrl
                        ? apiBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "")
                        : "";
                      const oauthPath = "/oauth2/authorization/google";
                      const oauthRedirectUrl = oauthBaseUrl ? `${oauthBaseUrl}${oauthPath}` : oauthPath;
                      window.location.href = oauthRedirectUrl;
                    }}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Login with Google
                  </Button>

                  <Button variant="outline" className="w-full border-gray-300 bg-white text-gray-900 hover:bg-gray-50" asChild>
                    <Link to="/create-account">Sign up</Link>
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;