import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Filter, ShoppingBag, Clock, Star, 
  IndianRupee, Zap, Trophy, Gift,
  Pizza, Coffee, Salad, Cookie, UtensilsCrossed,
  TrendingUp, Heart, MapPin, ChevronRight, Sparkles,
  Timer, Users, Percent
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Outlet, Dish } from "@shared/schema";

// Category icons mapping
const categoryIcons = {
  "Fast Food": Pizza,
  "Beverages": Coffee,
  "Healthy": Salad,
  "Desserts": Cookie,
  "All": UtensilsCrossed,
};

const categoryColors = {
  "Fast Food": "bg-primary/10 dark:bg-primary/20 text-primary",
  "Beverages": "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
  "Healthy": "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300",
  "Desserts": "bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300",
  "All": "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [budgetFilter, setBudgetFilter] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("explore");

  // Fetch outlets
  const { data: outlets = [], isLoading: outletsLoading } = useQuery<(Outlet & { dishCount?: number })[]>({
    queryKey: ['/api/outlets'],
  });

  // Fetch trending dishes
  const { data: trendingDishes = [] } = useQuery<(Dish & { outletName?: string })[]>({
    queryKey: ['/api/dishes/trending'],
  });

  // Fetch comfort food
  const { data: comfortFood = [] } = useQuery<(Dish & { outletName?: string })[]>({
    queryKey: ['/api/dishes/comfort'],
  });

  // Fetch rewards
  const { data: userRewards } = useQuery<{ tokens: number; badges: number }>({
    queryKey: ['/api/user/rewards'],
  });

  // Filter outlets based on search and budget
  const filteredOutlets = outlets.filter(outlet => {
    const matchesSearch = outlet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         outlet.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBudget = !budgetFilter || outlet.averagePrice <= budgetFilter;
    return matchesSearch && matchesBudget;
  });

  const categories = ["All", "Fast Food", "Beverages", "Healthy", "Desserts"];

  // Quick budget options
  const quickBudgets = [50, 100, 150, 200];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b backdrop-blur-lg bg-opacity-95">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Pizza className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Campus Biites</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {user?.universityId ? "Your Campus" : "All Campuses"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="relative"
                onClick={() => setLocation("/rewards")}
                data-testid="button-rewards"
              >
                <Gift className="w-5 h-5" />
                {userRewards?.tokens && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {userRewards.tokens}
                  </Badge>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setLocation("/leaderboard")}
                data-testid="button-leaderboard"
              >
                <Trophy className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setLocation("/profile")}
                data-testid="button-profile"
              >
                <Users className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search outlets, dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-10 h-10"
              data-testid="input-search"
            />
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setLocation("/budget")}
              data-testid="button-filter"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Quick Actions */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 px-4 py-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Hi {user?.firstName || "Student"}! 👋</h2>
              <p className="text-sm text-muted-foreground">What's your craving today?</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Your Tokens</p>
              <p className="text-xl font-bold text-primary">{user?.tokens || 0}</p>
            </div>
          </div>

          {/* Quick Budget Selection */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Badge 
              variant={!budgetFilter ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setBudgetFilter(null)}
              data-testid="badge-budget-all"
            >
              All Prices
            </Badge>
            {quickBudgets.map(amount => (
              <Badge 
                key={amount}
                variant={budgetFilter === amount ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setBudgetFilter(amount)}
                data-testid={`badge-budget-${amount}`}
              >
                Under ₹{amount}
              </Badge>
            ))}
          </div>

          {/* Categories */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map(category => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons];
              const colorClass = categoryColors[category as keyof typeof categoryColors];
              return (
                <button
                  key={category}
                  className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                    selectedCategory === category 
                      ? colorClass + " ring-2 ring-primary" 
                      : "bg-card hover-elevate"
                  }`}
                  onClick={() => setSelectedCategory(category)}
                  data-testid={`button-category-${category}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium">{category}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="explore">
              <Sparkles className="w-4 h-4 mr-1" />
              Explore
            </TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="w-4 h-4 mr-1" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="comfort">
              <Heart className="w-4 h-4 mr-1" />
              For You
            </TabsTrigger>
          </TabsList>

          {/* Explore Tab */}
          <TabsContent value="explore" className="space-y-6">
            {/* Special Offers */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Special Offers</h3>
                <Button variant="ghost" size="sm" data-testid="button-see-all-offers">
                  See all <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 dark:from-primary/20 dark:to-primary/10 dark:border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">20% OFF</span>
                    </div>
                    <p className="text-xs text-primary">On orders above ₹150</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">Free Delivery</span>
                    </div>
                    <p className="text-xs text-purple-700 dark:text-purple-300">Order now!</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* All Outlets */}
            <section>
              <h3 className="text-lg font-semibold mb-4">All Outlets</h3>
              {outletsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : filteredOutlets.length > 0 ? (
                <div className="space-y-3">
                  {filteredOutlets.map(outlet => (
                    <Card 
                      key={outlet.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => setLocation(`/outlet/${outlet.id}`)}
                      data-testid={`card-outlet-${outlet.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                            <UtensilsCrossed className="w-8 h-8 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-semibold truncate">{outlet.name}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {outlet.description}
                                </p>
                              </div>
                              {outlet.rating && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                  <span className="text-xs font-medium">{parseFloat(outlet.rating).toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <IndianRupee className="w-3 h-3" />
                                <span>₹{outlet.averagePrice}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>10-15 min</span>
                              </div>
                              {outlet.isChillPeriod && (
                                <Badge variant="secondary" className="text-xs">
                                  <Timer className="w-3 h-3 mr-1" />
                                  Busy
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No outlets found</p>
                    <p className="text-xs mt-1">Try adjusting your filters</p>
                  </CardContent>
                </Card>
              )}
            </section>
          </TabsContent>

          {/* Trending Tab */}
          <TabsContent value="trending" className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-4">Trending Now 🔥</h3>
              {trendingDishes.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {trendingDishes.slice(0, 6).map(dish => (
                    <Card 
                      key={dish.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => setLocation(`/outlet/${dish.outletId}`)}
                      data-testid={`card-dish-${dish.id}`}
                    >
                      <CardContent className="p-3">
                        <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-3">
                          <Pizza className="w-12 h-12 text-primary" />
                        </div>
                        <h4 className="font-medium text-sm truncate">{dish.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {dish.outletName || "Campus Outlet"}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-primary">₹{dish.price}</span>
                          {dish.isVeg && (
                            <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20">
                              Veg
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No trending items yet</p>
                    <p className="text-xs mt-1">Check back later!</p>
                  </CardContent>
                </Card>
              )}
            </section>
          </TabsContent>

          {/* Comfort Food Tab */}
          <TabsContent value="comfort" className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-4">Your Favorites ❤️</h3>
              {comfortFood.length > 0 ? (
                <div className="space-y-3">
                  {comfortFood.map(dish => (
                    <Card 
                      key={dish.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => setLocation(`/outlet/${dish.outletId}`)}
                      data-testid={`card-comfort-${dish.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-900/20 dark:to-pink-900/10 flex items-center justify-center">
                            <Heart className="w-7 h-7 text-pink-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{dish.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {dish.outletName || "Campus Outlet"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">₹{dish.price}</p>
                            <p className="text-xs text-muted-foreground">Ordered 5 times</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Order food to build your favorites!</p>
                    <p className="text-xs mt-1">We'll remember what you love</p>
                  </CardContent>
                </Card>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t">
        <div className="flex items-center justify-around py-2">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => setLocation("/")}
            data-testid="nav-home"
          >
            <Pizza className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => setLocation("/orders")}
            data-testid="nav-orders"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-xs">Orders</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => setLocation("/rewards")}
            data-testid="nav-rewards"
          >
            <Gift className="w-5 h-5" />
            <span className="text-xs">Rewards</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => setLocation("/profile")}
            data-testid="nav-profile"
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
}