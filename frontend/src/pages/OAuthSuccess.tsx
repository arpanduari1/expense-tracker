import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { setAuthToken, setRefreshToken } from "@/utils/tokenStorage";
import { tokenRefreshService } from "@/services/tokenRefreshService";
import { showError, showSuccess } from "@/utils/toast";
import { StaticLogo } from "@/components/StaticLogo";

const OAuthSuccess = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isProcessing, setIsProcessing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processOAuthCallback = async () => {
            try {
                // Extract tokens from URL hash fragment
                // URL format: /oauth-success#accessToken=...&refreshToken=...&tokenType=Bearer
                const hash = window.location.hash.substring(1); // Remove the leading '#'
                const params = new URLSearchParams(hash);

                const accessToken = params.get("accessToken");
                const refreshToken = params.get("refreshToken");
                const tokenType = params.get("tokenType");

                // Validate tokens
                if (!accessToken || !refreshToken) {
                    throw new Error("Missing authentication tokens. Please try logging in again.");
                }

                // Store tokens in localStorage
                setAuthToken(accessToken);
                setRefreshToken(refreshToken);

                // Clear all cached data from previous user
                queryClient.clear();

                // Invalidate specific user-related queries to ensure fresh data
                queryClient.invalidateQueries({ queryKey: ["user-profile"] });
                queryClient.invalidateQueries({ queryKey: ["user"] });

                // Start token monitoring for automatic refresh
                tokenRefreshService.startTokenMonitoring();

                // Show success message
                showSuccess("Successfully logged in with Google!");

                // Redirect to dashboard
                navigate("/dashboard", { replace: true });
            } catch (err: any) {
                console.error("OAuth callback processing failed:", err);
                setError(err.message || "Authentication failed. Please try again.");
                showError(err.message || "Authentication failed. Please try again.");
                setIsProcessing(false);

                // Redirect to login after a short delay
                setTimeout(() => {
                    navigate("/login", { replace: true });
                }, 3000);
            }
        };

        processOAuthCallback();
    }, [navigate, queryClient]);

    return (
        <div className="min-h-screen bg-[#C7BFBF] flex items-center justify-center p-4 light">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-md w-full p-8">
                <div className="flex flex-col items-center justify-center space-y-6">
                    <StaticLogo className="h-16" />

                    {isProcessing && !error ? (
                        <>
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#644a40] border-t-transparent"></div>
                            <div className="text-center space-y-2">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Completing sign in...
                                </h2>
                                <p className="text-gray-600">
                                    Please wait while we set up your account.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-center space-y-2">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                    <svg
                                        className="h-6 w-6 text-red-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                        />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Authentication Failed
                                </h2>
                                <p className="text-gray-600">
                                    {error}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Redirecting to login...
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OAuthSuccess;
