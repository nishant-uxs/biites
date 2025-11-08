import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export function RoleBasedRedirect() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      switch (user.role) {
        case "app_admin":
          setLocation("/admin");
          break;
        case "university_admin":
          setLocation("/university-dashboard");
          break;
        case "outlet_owner":
          setLocation("/outlet-dashboard");
          break;
        case "student":
          if (!user.universityId) {
            setLocation("/select-university");
          } else {
            setLocation("/home");
          }
          break;
        default:
          setLocation("/login");
      }
    }
  }, [user, isLoading, setLocation]);

  return (
    <div className="flex h-screen items-center justify-center" data-testid="loading-redirect">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
