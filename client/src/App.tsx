import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleBasedRedirect } from "@/components/RoleBasedRedirect";
import { BottomNav } from "@/components/bottom-nav";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Home from "@/pages/home";
import Orders from "@/pages/orders";
import Rewards from "@/pages/rewards";
import Profile from "@/pages/profile";
import OutletDetail from "@/pages/outlet-detail";
import AdminDashboard from "@/pages/admin";
import UniversityDashboard from "@/pages/university-dashboard";
import OutletDashboard from "@/pages/outlet-dashboard";
import SelectUniversity from "@/pages/select-university";
import Leaderboard from "@/pages/leaderboard";
import Unauthorized from "@/pages/unauthorized";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/unauthorized" component={Unauthorized} />
      
      {/* Root route - redirect based on auth status */}
      <Route path="/">
        {isAuthenticated ? <RoleBasedRedirect /> : <Landing />}
      </Route>

      {/* Protected routes - always registered, ProtectedRoute handles auth */}
      <Route path="/select-university">
        <ProtectedRoute allowedRoles={["student"]}>
          <SelectUniversity />
        </ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute allowedRoles={["app_admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/university-dashboard">
        <ProtectedRoute allowedRoles={["university_admin", "app_admin"]}>
          <UniversityDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/outlet-dashboard">
        <ProtectedRoute allowedRoles={["outlet_owner"]}>
          <OutletDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/home">
        <ProtectedRoute allowedRoles={["student"]} requireUniversity={true}>
          <Home />
        </ProtectedRoute>
      </Route>

      <Route path="/budget">
        <ProtectedRoute allowedRoles={["student"]} requireUniversity={true}>
          <Home />
        </ProtectedRoute>
      </Route>

      <Route path="/orders">
        <ProtectedRoute allowedRoles={["student"]} requireUniversity={true}>
          <Orders />
        </ProtectedRoute>
      </Route>

      <Route path="/rewards">
        <ProtectedRoute allowedRoles={["student"]} requireUniversity={true}>
          <Rewards />
        </ProtectedRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>

      <Route path="/leaderboard">
        <ProtectedRoute>
          <Leaderboard />
        </ProtectedRoute>
      </Route>

      <Route path="/outlet/:id">
        <ProtectedRoute allowedRoles={["student"]} requireUniversity={true}>
          <OutletDetail />
        </ProtectedRoute>
      </Route>
      
      {/* 404 - catch all */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, user } = useAuth();

  return (
    <>
      <Router />
      {isAuthenticated && user?.role === 'student' && <BottomNav />}
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
