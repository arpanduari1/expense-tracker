import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isTokenExpired } from "@/utils/tokenUtils";
import { performLogoutWithoutQuery } from "@/utils/logout";
import { getAuthToken } from "@/utils/tokenStorage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!requireAuth) return;

  const token = getAuthToken();
    
    if (!token) {
      console.log("No auth token found, redirecting to login");
      performLogoutWithoutQuery(navigate);
      return;
    }

    if (isTokenExpired(token)) {
      console.log("Auth token expired, redirecting to login");
      performLogoutWithoutQuery(navigate);
      return;
    }
  }, [navigate, requireAuth]);

  return <>{children}</>;
};

export default ProtectedRoute;