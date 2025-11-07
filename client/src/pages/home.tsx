import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BudgetFilter } from "@/components/budget-filter";
import { OutletCard } from "@/components/outlet-card";
import { DishCard } from "@/components/dish-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TrendingUp, Heart, LogOut, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Outlet, Dish, University } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [budget, setBudget] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'trending' | 'comfort'>('trending');
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>("");

  // Show university selection if user doesn't have one
  const showUniversityDialog = user && user.role === "student" && !user.universityId;

  // Fetch universities
  const { data: universities = [] } = useQuery<University[]>({
    queryKey: ['/api/universities'],
  });

  // Fetch outlets
  const { data: outlets, isLoading: outletsLoading } = useQuery<(Outlet & { dishCount: number })[]>({
    queryKey: ['/api/outlets'],
  });

  const updateUniversityMutation = useMutation({
    mutationFn: async (universityId: string) => {
      const response = await apiRequest("PATCH", "/api/auth/user/university", { universityId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome!",
        description: "University selected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/outlets'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUniversitySelect = () => {
    if (!selectedUniversityId) {
      toast({
        title: "Error",
        description: "Please select a university",
        variant: "destructive",
      });
      return;
    }
    updateUniversityMutation.mutate(selectedUniversityId);
  };

  // Fetch trending dishes
  const { data: trendingDishes } = useQuery<(Dish & { outletName: string })[]>({
    queryKey: ['/api/dishes/trending'],
  });

  // Fetch comfort food
  const { data: comfortFood } = useQuery<(Dish & { outletName: string; orderCount: number })[]>({
    queryKey: ['/api/dishes/comfort'],
  });

  const filteredOutlets = budget
    ? outlets?.filter(outlet => outlet.averagePrice <= budget)
    : outlets;

  const filteredTrending = budget
    ? trendingDishes?.filter(dish => dish.price <= budget)
    : trendingDishes;

  const filteredComfort = budget
    ? comfortFood?.filter(dish => dish.price <= budget)
    : comfortFood;

  return (
    <div className="min-h-screen pb-20">
      {/* University Selection Dialog */}
      <Dialog open={showUniversityDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Select Your University
            </DialogTitle>
            <DialogDescription>
              Choose your campus to see relevant food outlets
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="university">University</Label>
            <div className="space-y-2">
              {universities.map((university) => (
                <button
                  key={university.id}
                  data-testid={`button-university-${university.id}`}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all hover-elevate ${
                    selectedUniversityId === university.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  }`}
                  onClick={() => setSelectedUniversityId(university.id)}
                >
                  <h4 className="font-semibold">{university.name}</h4>
                  <p className="text-sm text-muted-foreground">{university.location}</p>
                </button>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={handleUniversitySelect}
              disabled={updateUniversityMutation.isPending || !selectedUniversityId}
              data-testid="button-confirm-university"
            >
              {updateUniversityMutation.isPending ? "Saving..." : "Continue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-card-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-7xl">
          <h1 className="text-2xl font-bold">
            Campus <span className="text-primary">Biites</span>
          </h1>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = "/api/logout"}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-8">
        {/* Budget Filter */}
        <BudgetFilter onBudgetChange={setBudget} currentBudget={budget} />

        {/* Quick Access Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={activeTab === 'trending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('trending')}
            className="flex-shrink-0"
            data-testid="button-tab-trending"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Trending
          </Button>
          <Button
            variant={activeTab === 'comfort' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('comfort')}
            className="flex-shrink-0"
            data-testid="button-tab-comfort"
          >
            <Heart className="w-4 h-4 mr-1" />
            Comfort Food
          </Button>
        </div>

        {/* Featured Section */}
        {activeTab === 'trending' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Trending Now</h2>
              {budget && (
                <Badge variant="secondary">Within ₹{budget}</Badge>
              )}
            </div>
            
            {filteredTrending && filteredTrending.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTrending.slice(0, 8).map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    onAdd={() => setLocation(`/outlet/${dish.outletId}`)}
                    showNutrition={false}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No trending items match your budget</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'comfort' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Comfort Food</h2>
              {budget && (
                <Badge variant="secondary">Within ₹{budget}</Badge>
              )}
            </div>
            
            {filteredComfort && filteredComfort.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredComfort.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    onAdd={() => setLocation(`/outlet/${dish.outletId}`)}
                    showNutrition={false}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Order food to build your comfort food list!</p>
              </div>
            )}
          </section>
        )}

        {/* All Outlets */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">All Outlets</h2>
          
          {outletsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredOutlets && filteredOutlets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOutlets.map((outlet) => (
                <OutletCard
                  key={outlet.id}
                  outlet={outlet}
                  onClick={() => setLocation(`/outlet/${outlet.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No outlets available within your budget</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
