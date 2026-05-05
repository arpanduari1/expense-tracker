import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
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
import { showError, showSuccess } from "@/utils/toast";
import { useMutation } from "@tanstack/react-query";
import { verifyOtp, resendOtp } from "@/services/authService";

const formSchema = z.object({
  otp: z.string().min(6, { message: "Your one-time password must be 6 characters." }),
});

const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (data: { token: string; otp: string }) => verifyOtp(data),
    onSuccess: (data) => {
      console.log('Verification success:', data);
      showSuccess("Account verified successfully! Please log in with your credentials.");
      
      // After successful verification, redirect to login
      navigate("/login");
    },
    onError: (error: any) => {
      console.error('Verification error:', error);
      
      let errorMessage = "Verification failed. Please try again.";
      
      if (error.response?.status === 400) {
        errorMessage = "Invalid or expired OTP. Please check the code and try again.";
      } else if (error.response?.status === 404) {
        errorMessage = "Verification token not found. Please request a new verification email.";
      } else if (error.response?.status === 410) {
        errorMessage = "Verification token has expired. Please request a new verification email.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message === 'Network Error') {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      showError(errorMessage);
    },
  });

  const resendMutation = useMutation({
    mutationFn: (email: string) => resendOtp({ email }),
    onSuccess: () => {
      showSuccess("A new OTP has been sent to your email.");
    },
    onError: (error: any) => {
      console.error('Resend OTP error:', error);
      let errorMessage = "Failed to resend OTP. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      showError(errorMessage);
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Verification requires a token according to the API
    if (!token) {
      console.error('No verification token available');
      return;
    }
    
    const verifyData = { token: token, otp: values.otp };
    verifyMutation.mutate(verifyData);
  };

  const onResend = () => {
    if (email) {
      resendMutation.mutate(email);
    }
  };

  if (!email || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f9f9f9] light">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#202020]">Invalid Verification Link</h1>
          <p className="text-[#646464]">
            The verification link is missing required information (email or token).
          </p>
          <Button asChild variant="link">
            <Link to="/create-account">Go back to Sign Up</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f9f9f9] light">
      <div className="mx-auto grid w-[350px] gap-6 text-center">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold text-[#202020]">Check your email</h1>
          <p className="text-balance text-[#646464]">
            We've sent a 6-digit code to <strong className="text-[#202020]">{email}</strong>. 
            {token ? " The code expires shortly, so please enter it soon." : " Please check your email and enter the verification code below."}
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">One-Time Password</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup className="mx-auto">
                        <InputOTPSlot index={0} className="bg-white border-gray-300 text-gray-900 font-bold text-lg" />
                        <InputOTPSlot index={1} className="bg-white border-gray-300 text-gray-900 font-bold text-lg" />
                        <InputOTPSlot index={2} className="bg-white border-gray-300 text-gray-900 font-bold text-lg" />
                        <InputOTPSlot index={3} className="bg-white border-gray-300 text-gray-900 font-bold text-lg" />
                        <InputOTPSlot index={4} className="bg-white border-gray-300 text-gray-900 font-bold text-lg" />
                        <InputOTPSlot index={5} className="bg-white border-gray-300 text-gray-900 font-bold text-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-[#644a40] hover:bg-[#582d1d] text-white border-0" disabled={verifyMutation.isPending}>
              {verifyMutation.isPending ? "Verifying..." : "Verify Account"}
            </Button>
          </form>
        </Form>
        <div className="text-sm text-[#646464]">
          Didn't get a code?{" "}
          <Button 
            variant="link" 
            className="p-0 h-auto text-[#644a40] hover:text-[#582d1d]" 
            onClick={onResend}
            disabled={resendMutation.isPending}
          >
            {resendMutation.isPending ? "Sending..." : "Click to resend"}
          </Button>
        </div>
        <Button variant="outline" className="w-full border-gray-300 bg-white text-gray-900 hover:bg-gray-50" asChild>
          <Link to="/login">Back to Sign In</Link>
        </Button>
      </div>
    </div>
  );
};

export default VerifyAccount;