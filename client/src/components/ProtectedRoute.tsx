import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@shared/schema";

type UserRole = User["role"];

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireUniversity?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireUniversity = false 
}: ProtectedRouteProps) {
  const { user, isLoading, isRefreshing, isAuthenticated } = useAuth();

  // Show loading during initial auth check or refresh after login
  if (isLoading || isRefreshing) {
    return (
      <div className="flex h-screen items-center justify-center" data-testid="loading-auth">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Redirect to="/unauthorized" />;
  }

  if (requireUniversity && user?.role === "student" && !user.universityId) {
    return <Redirect to="/select-university" />;
  }

  return <>{children}</>;
}
