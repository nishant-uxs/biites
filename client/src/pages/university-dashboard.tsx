import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Store, Plus, Star, TrendingUp, Upload, Loader2 } from "lucide-react";
import type { Outlet } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

interface ExtractedDish {
  name: string;
  price: number;
  description?: string;
  category?: string;
  isVeg?: boolean;
  calories?: number;
  protein?: number;
  carbs?: number;
  sugar?: number;
}

export default function UniversityDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    averagePrice: "",
  });
  const [menuImageUrl, setMenuImageUrl] = useState("");
  const [extractedDishes, setExtractedDishes] = useState<ExtractedDish[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(false);

  // Redirect if not university admin or app admin
  if (user && user.role !== "university_admin" && user.role !== "app_admin") {
    setLocation("/");
    return null;
  }

  const { data: outlets = [] } = useQuery<Outlet[]>({
    queryKey: ['/api/outlets'],
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest<{ uploadURL: string }>("POST", "/api/objects/upload", {});
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]) {
      const uploadedUrl = result.successful[0].uploadURL as string;
      
      await apiRequest("POST", "/api/objects/set-acl", {
        objectURL: uploadedUrl,
        visibility: "public",
      });

      setMenuImageUrl(uploadedUrl);
      setExtractionError(false);

      setIsExtracting(true);
      try {
        const extractResponse = await apiRequest<{ dishes: ExtractedDish[] }>("POST", "/api/menu/extract", {
          menuImageUrl: uploadedUrl,
        });

        setExtractedDishes(extractResponse.dishes);
        setExtractionError(false);
        toast({
          title: "Menu extracted successfully",
          description: `Found ${extractResponse.dishes.length} dishes from the menu photo`,
        });
      } catch (error) {
        setExtractedDishes([]);
        setMenuImageUrl("");
        setExtractionError(true);
        toast({
          title: "Extraction failed",
          description: "Could not extract dishes from the menu photo. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const createOutletMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.universityId) {
        throw new Error("University not set");
      }

      const outletResponse = await apiRequest<{ id: string }>("POST", "/api/outlets", {
        name: data.name,
        description: data.description,
        averagePrice: parseInt(data.averagePrice) || 100,
        universityId: user.universityId,
        imageUrl: menuImageUrl || null,
      });

      if (extractedDishes.length > 0) {
        await Promise.all(
          extractedDishes.map((dish) =>
            apiRequest("POST", "/api/dishes", {
              outletId: outletResponse.id,
              name: dish.name,
              description: dish.description || "",
              price: dish.price,
              category: dish.category || "main_course",
              isVeg: dish.isVeg ?? true,
              calories: dish.calories,
              protein: dish.protein,
              carbs: dish.carbs,
              sugar: dish.sugar,
            })
          )
        );
      }

      return outletResponse;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: `Outlet created with ${extractedDishes.length} dishes`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outlets'] });
      setFormData({ name: "", description: "", averagePrice: "" });
      setMenuImageUrl("");
      setExtractedDishes([]);
      setExtractionError(false);
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
              <div className="space-y-2">
                <Label>Menu Photo (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload a menu photo and we'll automatically extract all dishes using AI
                </p>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload Menu Photo</span>
                  </div>
                </ObjectUploader>
                {isExtracting && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting dishes from menu photo...
                  </p>
                )}
                {extractionError && (
                  <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive" data-testid="text-extraction-error">
                    Menu extraction failed. Please upload a clearer menu photo and try again.
                  </div>
                )}
                {extractedDishes.length > 0 && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2" data-testid="text-dishes-extracted">
                      Extracted {extractedDishes.length} dishes:
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {extractedDishes.map((dish, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-2 bg-background rounded border"
                          data-testid={`dish-item-${idx}`}
                        >
                          <span className="font-medium">{dish.name}</span> - ₹{dish.price}
                          {dish.description && (
                            <p className="text-muted-foreground mt-0.5">{dish.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={createOutletMutation.isPending || isExtracting}
                data-testid="button-create-outlet"
              >
                {createOutletMutation.isPending ? "Creating..." : isExtracting ? "Extracting menu..." : "Create Outlet"}
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
