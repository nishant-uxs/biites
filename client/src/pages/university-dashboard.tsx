import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Store, Plus, Star, TrendingUp } from "lucide-react";
import type { Outlet } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function UniversityDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    averagePrice: "",
  });

  // Redirect if not university admin or app admin
  if (user && user.role !== "university_admin" && user.role !== "app_admin") {
    setLocation("/");
    return null;
  }

  const { data: outlets = [] } = useQuery<Outlet[]>({
    queryKey: ['/api/outlets'],
  });

  const createOutletMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/outlets", {
        name: data.name,
        description: data.description,
        averagePrice: parseInt(data.averagePrice) || 100,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Outlet created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outlets'] });
      setFormData({ name: "", description: "", averagePrice: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.averagePrice) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    createOutletMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen pb-20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">University Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage outlets for your campus</p>
          </div>
        </div>

        {/* Add Outlet Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add New Outlet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="outlet-name">Outlet Name *</Label>
                <Input
                  id="outlet-name"
                  data-testid="input-outlet-name"
                  placeholder="e.g., North Campus Canteen"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outlet-description">Description</Label>
                <Textarea
                  id="outlet-description"
                  data-testid="input-outlet-description"
                  placeholder="Brief description of the outlet"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outlet-price">Average Price (₹) *</Label>
                <Input
                  id="outlet-price"
                  data-testid="input-outlet-price"
                  type="number"
                  placeholder="e.g., 80"
                  value={formData.averagePrice}
                  onChange={(e) => setFormData({ ...formData, averagePrice: e.target.value })}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={createOutletMutation.isPending}
                data-testid="button-create-outlet"
              >
                {createOutletMutation.isPending ? "Creating..." : "Create Outlet"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Outlets List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Your Outlets ({outlets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {outlets.map((outlet) => (
                <div
                  key={outlet.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border"
                  data-testid={`outlet-card-${outlet.id}`}
                >
                  <div>
                    <h3 className="font-semibold text-lg" data-testid={`text-outlet-name-${outlet.id}`}>
                      {outlet.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{outlet.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Avg Price: ₹{outlet.averagePrice}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium" data-testid={`text-rating-${outlet.id}`}>
                        {parseFloat(outlet.rating || "0").toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="font-medium" data-testid={`text-active-orders-${outlet.id}`}>
                        {outlet.activeOrdersCount} active
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {outlets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No outlets added yet</p>
                  <p className="text-xs mt-1">Add your first outlet using the form above</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
