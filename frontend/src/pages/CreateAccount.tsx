import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { StaticLogo } from "@/components/StaticLogo";
import { showError, showSuccess } from "@/utils/toast";
import { useMutation } from "@tanstack/react-query";
import { register } from "@/services/authService";
import type { RegisterData } from "@/types";
import { extractValidationErrors, shouldShowFieldErrors, getGeneralErrorMessage } from "@/utils/validationErrorUtils";

const formSchema = z
  .object({
    username: z.string().min(2, { message: "Username must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
    currency: z.string({ required_error: "Please select a currency." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const CreateAccount = () => {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      currency: "INR",
    },
  });

  const mutation = useMutation({
    mutationFn: (userData: RegisterData) => register(userData),
    onSuccess: (data, variables) => {
      showSuccess("Registration successful! Please check your email for verification.");
      
      if (data.verificationToken) {
        navigate(`/verify-account?token=${data.verificationToken}&email=${variables.email}`);
      } else {
        console.warn('No verification token received from registration');
        navigate(`/verify-account?email=${variables.email}`);
      }
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      
      // Check for field-specific validation errors
      if (shouldShowFieldErrors(error)) {
        const validationErrors = extractValidationErrors(error);
        
        if (validationErrors.length > 0) {
          // Set field-specific errors
          validationErrors.forEach(({ field, message }) => {
            const fieldNames = ['username', 'email', 'password', 'confirmPassword', 'currency'];
            if (fieldNames.includes(field)) {
              form.setError(field as any, {
                type: 'server',
                message
              });
            }
          });
          
          // Show general toast for validation errors
          showError("Please fix the validation errors below.");
          return;
        }
      }
      
      // Handle general errors with toast
      const errorMessage = getGeneralErrorMessage(
        error, 
        "Registration failed. Please try again."
      );
      
      showError(errorMessage);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const userData: RegisterData = {
      username: values.username,
      email: values.email,
      password: values.password,
      currency: values.currency,
    };
    
    mutation.mutate(userData);
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

          {/* Right side - Registration form */}
          <div className="flex items-center justify-center p-12">
            <div className="w-full max-w-lg space-y-0">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
                <p className="text-gray-600">
                  Enter your information below
                  <br />
                  to create an account
                </p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="your username" 
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Email</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Confirm Password</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-gray-300 bg-white text-gray-900 focus:border-[#644a40] focus:ring-[#644a40]">
                              <SelectValue placeholder="Select a currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border-gray-300">
                            <SelectItem value="INR" className="text-gray-900 hover:bg-gray-100">INR (Indian Rupee)</SelectItem>
                            <SelectItem value="USD" className="text-gray-900 hover:bg-gray-100">USD (US Dollar)</SelectItem>
                            <SelectItem value="EUR" className="text-gray-900 hover:bg-gray-100">EUR (Euro)</SelectItem>
                            <SelectItem value="GBP" className="text-gray-900 hover:bg-gray-100">GBP (British Pound)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-[#644a40] hover:bg-[#582d1d] text-white border-0"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? "Creating Account..." : "Create an account"}
                  </Button>
                  <div className="text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link to="/login" className="text-[#644a40] hover:underline font-medium">
                      Sign in
                    </Link>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;