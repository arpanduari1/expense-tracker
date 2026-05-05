import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { forgotPassword } from "@/services/authService";
import { showError, showSuccess } from "@/utils/toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StaticLogo } from "@/components/StaticLogo";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

const ForgotPassword = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (email: string) => forgotPassword(email),
    onSuccess: (data) => {
      showSuccess("Password reset instructions have been sent to your email.");
      setIsSubmitted(true);
    },
    onError: (error: any) => {
      console.error('Forgot password error:', error);
      let errorMessage = "Failed to send reset instructions. Please try again.";
      
      if (error.response?.status === 404) {
        errorMessage = "No account found with this email address.";
      } else if (error.response?.status === 429) {
        errorMessage = "Too many reset attempts. Please wait before trying again.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      showError(errorMessage);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values.email);
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f9f9f9] light">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <StaticLogo className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#202020]">Check Your Email</CardTitle>
            <CardDescription className="text-[#646464]">
              We've sent password reset instructions to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                If you don't see the email, please check your spam folder.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsSubmitted(false)}
              >
                Try Another Email
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f9f9f9] light">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <StaticLogo className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#202020]">Forgot Password</CardTitle>
          <CardDescription className="text-[#646464]">
            Enter your email address and we'll send you instructions to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
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
                  {mutation.isPending ? "Sending..." : "Send Reset Instructions"}
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

export default ForgotPassword;