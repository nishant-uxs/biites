import { Home, DollarSign, ShoppingBag, Gift, User } from "lucide-react";
import { useLocation } from "wouter";

export function BottomNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/", testId: "nav-home" },
    { icon: DollarSign, label: "Budget", path: "/budget", testId: "nav-budget" },
    { icon: ShoppingBag, label: "Orders", path: "/orders", testId: "nav-orders" },
    { icon: Gift, label: "Rewards", path: "/rewards", testId: "nav-rewards" },
    { icon: User, label: "Profile", path: "/profile", testId: "nav-profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ icon: Icon, label, path, testId }) => {
          const isActive = location === path;
          return (
            <button
              key={path}
              onClick={() => setLocation(path)}
              data-testid={testId}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[60px] hover-elevate active-elevate-2 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
