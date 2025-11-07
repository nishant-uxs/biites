import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BudgetFilter } from "@/components/budget-filter";
import { OutletCard } from "@/components/outlet-card";
import { DishCard } from "@/components/dish-card";
import { TrendingUp, Heart, LogOut } from "lucide-react";
import type { Outlet, Dish } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const [budget, setBudget] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'trending' | 'comfort'>('trending');

  // Fetch outlets
  const { data: outlets, isLoading: outletsLoading } = useQuery<(Outlet & { dishCount: number })[]>({
    queryKey: ['/api/outlets'],
  });

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
