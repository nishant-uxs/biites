import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, Plus, Star, TrendingUp, Upload, Loader2, Copy, Check, School,
  MapPin, Users, ShoppingBag, Clock, IndianRupee, ChefHat, Info,
  AlertCircle, Building2, Activity, Package2, Key, LogOut
} from "lucide-react";
import type { Outlet } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

interface CampusStats {
  totalOutlets: number;
  totalStudents: number;
  totalOrders: number;
  totalRevenue: number;
}

const outletSchema = z.object({
  name: z.string().min(1, "Outlet name is required"),
  description: z.string().min(1, "Description is required"),
  averagePrice: z.string().min(1, "Average price is required"),
});

type OutletFormValues = z.infer<typeof outletSchema>;

export default function UniversityDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddOutlet, setShowAddOutlet] = useState(false);
  
  const [menuImageUrl, setMenuImageUrl] = useState("");
  const [extractedDishes, setExtractedDishes] = useState<ExtractedDish[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState(false);
  
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const form = useForm<OutletFormValues>({
    resolver: zodResolver(outletSchema),
    defaultValues: {
      name: "",
      description: "",
      averagePrice: "",
    },
  });

  const resetOwnerPasswordMutation = useMutation({
    mutationFn: async (outletId: string) => {
      const response = await apiRequest("PATCH", `/api/outlets/${outletId}/owner/reset-password`);
      return await response.json();
    },
    onSuccess: (response: any) => {
      setGeneratedCredentials(response);
      setShowCredentials(true);
      toast({
        title: "Password Reset",
        description: "New password generated for outlet owner",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Redirect if not university admin or app admin
  if (user && user.role !== "university_admin" && user.role !== "app_admin") {
    setLocation("/");
    return null;
  }

  const { data: outlets = [], isLoading: outletsLoading } = useQuery<Outlet[]>({
    queryKey: ['/api/outlets'],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<CampusStats>({
    queryKey: ['/api/university/stats'],
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${field === 'email' ? 'Email' : 'Password'} copied to clipboard`,
    });
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data: any = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
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
        const extractResponse = await apiRequest("POST", "/api/menu/extract", {
          menuImageUrl: uploadedUrl,
        });
        const extractData: any = await extractResponse.json();

        setExtractedDishes(extractData.dishes);
        setExtractionError(false);
        toast({
          title: "Menu extracted successfully",
          description: `Found ${extractData.dishes.length} dishes from the menu photo`,
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
    mutationFn: async (data: OutletFormValues) => {
      if (!user?.universityId) {
        throw new Error("University not set");
      }

      const outletResponse = await apiRequest("POST", "/api/outlets", {
        name: data.name,
        description: data.description,
        averagePrice: parseInt(data.averagePrice) || 100,
        universityId: user.universityId,
        imageUrl: menuImageUrl || null,
      });
      
      const outletData: any = await outletResponse.json();

      // Create dishes if extracted
      if (extractedDishes.length > 0) {
        await Promise.all(
          extractedDishes.map((dish) =>
            apiRequest("POST", "/api/dishes", {
              outletId: outletData.outlet.id,
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

      return outletData;
    },
    onSuccess: (response: any) => {
      setGeneratedCredentials(response.credentials);
      setShowCredentials(true);
      queryClient.invalidateQueries({ queryKey: ['/api/outlets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/university/stats'] });
      form.reset();
      setMenuImageUrl("");
      setExtractedDishes([]);
      setExtractionError(false);
      setShowAddOutlet(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: OutletFormValues) => {
    createOutletMutation.mutate(values);
  };

  // Stats cards data
  const statsCards = [
    {
      title: "Total Outlets",
      value: stats?.totalOutlets || 0,
      icon: Store,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      description: "Food outlets",
    },
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20",
      description: "Registered students",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      description: "All time orders",
    },
    {
      title: "Campus Revenue",
      value: `₹${stats?.totalRevenue || 0}`,
      icon: IndianRupee,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      description: "Total revenue",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-20 items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <School className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">University Admin</h1>
              <p className="text-sm text-muted-foreground">Manage your campus food outlets</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="default" className="gap-1">
              <Activity className="w-3 h-3" />
              {user?.universityId ? "Campus Active" : "Global Admin"}
            </Badge>
            <Button variant="outline" size="sm" onClick={logout} data-testid="button-logout-university">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="outlets">Outlets</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statsLoading ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Loading statistics...
                </div>
              ) : (
                statsCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index} className="hover-elevate">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {stat.title}
                        </CardTitle>
                        <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Campus Info */}
            <Card>
              <CardHeader>
                <CardTitle>Campus Performance</CardTitle>
                <CardDescription>Real-time campus food service metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="font-medium">All Services Operational</span>
                  </div>
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                    Active
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">Avg Wait Time</p>
                    <p className="font-semibold text-lg">12 mins</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">Active Orders</p>
                    <p className="font-semibold text-lg">23</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">Satisfaction</p>
                    <p className="font-semibold text-lg">4.5★</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outlets Tab */}
          <TabsContent value="outlets" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Manage Outlets</CardTitle>
                  <CardDescription>Add and manage campus food outlets</CardDescription>
                </div>
                <Dialog open={showAddOutlet} onOpenChange={setShowAddOutlet}>
                  <Button onClick={() => setShowAddOutlet(true)} data-testid="button-add-outlet">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Outlet
                  </Button>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Outlet</DialogTitle>
                      <DialogDescription>
                        Create a new food outlet for your campus. Login credentials will be generated automatically.
                      </DialogDescription>
                    </DialogHeader>

                    {/* Menu Upload Section */}
                    {!menuImageUrl && (
                      <div className="space-y-4">
                        <Label>Upload Menu Photo (Optional)</Label>
                        <div className="border-2 border-dashed rounded-lg p-6">
                          <ObjectUploader
                            onGetUploadParameters={handleGetUploadParameters}
                            onUploadComplete={handleUploadComplete}
                            accept="image/*"
                            allowedMetaFields={[]}
                            restrictions={{
                              maxFileSize: 10 * 1024 * 1024,
                              maxNumberOfFiles: 1,
                              minNumberOfFiles: 0,
                              allowedFileTypes: ['image/*'],
                            }}
                            render={({ browseFiles }: { browseFiles: () => void }) => (
                              <div className="text-center">
                                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground mb-2">
                                  Upload a photo of the outlet's menu to automatically extract dishes
                                </p>
                                <Button type="button" variant="outline" onClick={browseFiles}>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Choose Menu Photo
                                </Button>
                              </div>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Extraction Status */}
                    {isExtracting && (
                      <div className="flex items-center justify-center py-6 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm">Extracting menu items...</span>
                      </div>
                    )}

                    {/* Extracted Dishes */}
                    {extractedDishes.length > 0 && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                          ✓ Successfully extracted {extractedDishes.length} dishes from menu
                        </p>
                        <div className="max-h-32 overflow-y-auto text-xs text-green-700 dark:text-green-300 space-y-1">
                          {extractedDishes.map((dish, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{dish.name}</span>
                              <span className="font-medium">₹{dish.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error State */}
                    {extractionError && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          Failed to extract menu. You can still create the outlet and add dishes manually later.
                        </p>
                      </div>
                    )}

                    {/* Outlet Form */}
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Outlet Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Campus Cafe" data-testid="input-outlet-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Fresh coffee, snacks, and quick meals"
                                  rows={3}
                                  data-testid="input-outlet-description" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="averagePrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Average Price (₹)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  placeholder="100"
                                  data-testid="input-average-price" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowAddOutlet(false);
                              form.reset();
                              setMenuImageUrl("");
                              setExtractedDishes([]);
                              setExtractionError(false);
                            }}
                            data-testid="button-cancel"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={createOutletMutation.isPending}
                            data-testid="button-submit"
                          >
                            {createOutletMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create Outlet"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {outletsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading outlets...
                  </div>
                ) : outlets.length === 0 ? (
                  <div className="text-center py-8">
                    <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No outlets added yet</p>
                    <Button variant="outline" onClick={() => setShowAddOutlet(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add your first outlet
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {outlets.map((outlet) => (
                      <OutletCard 
                        key={outlet.id} 
                        outlet={outlet} 
                        onResetPassword={() => resetOwnerPasswordMutation.mutate(outlet.id)}
                        isResetting={resetOwnerPasswordMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Credentials Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Outlet Owner Credentials</DialogTitle>
            <DialogDescription>
              Save these credentials securely. The password will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={generatedCredentials?.email || ""}
                  data-testid="text-generated-email"
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedCredentials?.email || "", "email")}
                  data-testid="button-copy-email"
                >
                  {copiedField === "email" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={generatedCredentials?.password || ""}
                  data-testid="text-generated-password"
                  className="flex-1 font-mono"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedCredentials?.password || "", "password")}
                  data-testid="button-copy-password"
                >
                  {copiedField === "password" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Share these credentials with the outlet owner. They will need them to log in and manage their menu.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowCredentials(false)} data-testid="button-close">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OutletCard({ outlet, onResetPassword, isResetting }: { outlet: Outlet; onResetPassword: () => void; isResetting: boolean }) {
  const rating = parseFloat(outlet.rating || "0");

  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg" data-testid={`text-outlet-name-${outlet.id}`}>
                {outlet.name}
              </h3>
              <p className="text-sm text-muted-foreground">{outlet.description}</p>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <div className="flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  Avg ₹{outlet.averagePrice}
                </div>
                {outlet.isChillPeriod && (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Chill Period
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onResetPassword}
              disabled={isResetting}
              title="Reset Outlet Owner Password"
              data-testid={`button-reset-outlet-owner-${outlet.id}`}
            >
              <Key className="w-4 h-4 mr-1" /> Reset Password
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}