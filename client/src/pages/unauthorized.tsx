import { Link } from "wouter";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Unauthorized() {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 max-w-md">
        <ShieldAlert className="w-16 h-16 mx-auto text-destructive" />
        <h1 className="text-3xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild variant="outline" data-testid="button-back-home">
            <Link href="/">Go Home</Link>
          </Button>
          <Button onClick={logout} variant="destructive" data-testid="button-logout">
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
