import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/bottom-nav";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Home from "@/pages/home";
import Orders from "@/pages/orders";
import Rewards from "@/pages/rewards";
import Profile from "@/pages/profile";
import OutletDetail from "@/pages/outlet-detail";
import AdminDashboard from "@/pages/admin";
import UniversityDashboard from "@/pages/university-dashboard";
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
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/budget" component={Home} />
          <Route path="/orders" component={Orders} />
          <Route path="/rewards" component={Rewards} />
          <Route path="/profile" component={Profile} />
          <Route path="/outlet/:id" component={OutletDetail} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/university-dashboard" component={UniversityDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Router />
      {isAuthenticated && <BottomNav />}
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
