import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Store, Plus, Edit, Trash2, Clock, Package, TrendingUp, Coffee, Soup, Pizza, Settings, Power, AlertCircle, ChefHat, DollarSign, Leaf, Upload, Loader2, Bell, CheckCircle, X, Check, ScanLine } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Dish, Outlet, Order } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

// Form schema for dish creation
const dishSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  category: z.enum(["appetizer", "main_course", "dessert", "beverage", "snacks"]),
  isVeg: z.boolean(),
  isAvailable: z.boolean(),
  calories: z.string().optional(),
  protein: z.string().optional(),
  carbs: z.string().optional(),
  sugar: z.string().optional(),
});

type DishFormValues = z.infer<typeof dishSchema>;

// Category icons
const categoryIcons = {
  appetizer: Soup,
  main_course: Pizza,
  dessert: Coffee,
  beverage: Coffee,
  snacks: Package,
};

// Countdown timer component for chill period
function ChillPeriodTimer({ endsAt }: { endsAt: Date }) {
  const [timeLeft, setTimeLeft] = useState("");
  
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = endsAt.getTime();
      const distance = end - now;
      
      if (distance < 0) {
        setTimeLeft("Expired");
        return;
      }
      
      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [endsAt]);
  
  return (
    <Badge variant="destructive" className="gap-1 font-mono">
      <AlertCircle className="w-3 h-3" />
      Chill Period: {timeLeft}
    </Badge>
  );
}

// OrderCard component for displaying individual orders with actions
function OrderCard({ order }: { order: Order }) {
  const [showQR, setShowQR] = useState(false);
  
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest("PATCH", `/api/orders/${order.id}/status`, { status: newStatus });
    },
    onSuccess: () => {
      // Invalidate both the orders list and outlet details
      queryClient.invalidateQueries({ queryKey: [`/api/outlet/${order.outletId}/orders`] });
      queryClient.invalidateQueries({ queryKey: ['/api/outlet/my'] });
      toast({
        title: "Order updated",
        description: "Order status has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  });
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'preparing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-lg">Order #{order.id.slice(-6)}</span>
              <Badge className={getStatusColor(order.status)}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
              }) : 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-xl">₹{order.totalAmount}</p>
            <p className="text-xs text-muted-foreground uppercase">{order.paymentMethod}</p>
          </div>
        </div>
        
        {order.specialInstructions && (
          <div className="mb-3 p-2 bg-muted rounded text-sm">
            <span className="font-medium">Note: </span>{order.specialInstructions}
          </div>
        )}
        
        {/* Action Buttons Based on Status */}
        <div className="flex gap-2 flex-wrap">
          {order.status === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={() => updateStatusMutation.mutate('confirmed')}
                disabled={updateStatusMutation.isPending}
                data-testid={`button-confirm-${order.id}`}
              >
                <Check className="w-4 h-4 mr-1" />
                Confirm Order
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateStatusMutation.mutate('cancelled')}
                disabled={updateStatusMutation.isPending}
                data-testid={`button-cancel-${order.id}`}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </>
          )}
          
          {order.status === 'confirmed' && (
            <Button
              size="sm"
              onClick={() => updateStatusMutation.mutate('preparing')}
              disabled={updateStatusMutation.isPending}
              data-testid={`button-start-preparing-${order.id}`}
            >
              <ChefHat className="w-4 h-4 mr-1" />
              Start Preparing
            </Button>
          )}
          
          {order.status === 'preparing' && (
            <Button
              size="sm"
              onClick={() => updateStatusMutation.mutate('ready')}
              disabled={updateStatusMutation.isPending}
              data-testid={`button-mark-ready-${order.id}`}
            >
              <Package className="w-4 h-4 mr-1" />
              Mark Ready
            </Button>
          )}
          
          {order.status === 'ready' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowQR(!showQR)}
                data-testid={`button-show-qr-${order.id}`}
              >
                <Package className="w-4 h-4 mr-1" />
                {showQR ? 'Hide' : 'Show'} QR Code
              </Button>
              <Button
                size="sm"
                onClick={() => updateStatusMutation.mutate('completed')}
                disabled={updateStatusMutation.isPending}
                data-testid={`button-complete-${order.id}`}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark Completed
              </Button>
            </>
          )}
        </div>
        
        {/* QR Code Display */}
        {showQR && order.status === 'ready' && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border text-center">
            <p className="text-sm font-medium mb-2">Pickup Verification QR Code</p>
            <div className="inline-block p-3 bg-white rounded">
              <QRCodeSVG value={order.qrCode} size={150} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ask customer to scan this QR code for pickup verification
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function OutletDashboard() {
  const { user } = useAuth();
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");
  
  // Menu extraction state
  const [menuImageUrl, setMenuImageUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedDishes, setExtractedDishes] = useState<any[]>([]);
  const [extractionError, setExtractionError] = useState(false);
  
  // Chill period state
  const [isChillDialogOpen, setIsChillDialogOpen] = useState(false);
  const [chillDuration, setChillDuration] = useState("30");
  
  // QR Scanner state
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [scannedQR, setScannedQR] = useState("");

  const form = useForm<DishFormValues>({
    resolver: zodResolver(dishSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "main_course",
      isVeg: true,
      isAvailable: true,
      calories: "",
      protein: "",
      carbs: "",
      sugar: "",
    },
  });

  // Fetch outlet details
  const { data: outlet } = useQuery<Outlet>({
    queryKey: ["/api/outlet/my"],
    enabled: !!user && user.role === "outlet_owner",
  });

  // Fetch dishes
  const { data: dishes = [], isLoading: dishesLoading } = useQuery<Dish[]>({
    queryKey: outlet ? [`/api/outlets/${outlet.id}/dishes`] : [],
    enabled: !!outlet,
  });

  // Fetch orders
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: outlet ? [`/api/outlet/${outlet.id}/orders`] : [],
    enabled: !!outlet,
  });

  // Add dish mutation
  const addDishMutation = useMutation({
    mutationFn: async (data: DishFormValues) => {
      if (!outlet) throw new Error("Outlet not found");
      
      const response = await apiRequest("POST", "/api/dishes", {
        outletId: outlet.id,
        name: data.name,
        description: data.description || "",
        price: parseFloat(data.price),
        category: data.category,
        isVeg: data.isVeg,
        isAvailable: data.isAvailable,
        calories: data.calories ? parseInt(data.calories) : null,
        protein: data.protein ? parseFloat(data.protein) : null,
        carbs: data.carbs ? parseFloat(data.carbs) : null,
        sugar: data.sugar ? parseFloat(data.sugar) : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/outlets/${outlet?.id}/dishes`] });
      toast({
        title: "Success",
        description: "Dish added successfully",
      });
      setIsAddDishOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit dish mutation
  const editDishMutation = useMutation({
    mutationFn: async (data: DishFormValues & { id: string }) => {
      const response = await apiRequest("PUT", `/api/dishes/${data.id}`, {
        name: data.name,
        description: data.description || "",
        price: parseFloat(data.price),
        category: data.category,
        isVeg: data.isVeg,
        isAvailable: data.isAvailable,
        calories: data.calories ? parseInt(data.calories) : null,
        protein: data.protein ? parseFloat(data.protein) : null,
        carbs: data.carbs ? parseFloat(data.carbs) : null,
        sugar: data.sugar ? parseFloat(data.sugar) : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/outlets/${outlet?.id}/dishes`] });
      toast({
        title: "Success",
        description: "Dish updated successfully",
      });
      setEditingDish(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete dish mutation
  const deleteDishMutation = useMutation({
    mutationFn: async (dishId: string) => {
      await apiRequest("DELETE", `/api/dishes/${dishId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/outlets/${outlet?.id}/dishes`] });
      toast({
        title: "Success",
        description: "Dish deleted successfully",
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

  // Scan student QR and confirm pickup
  const scanQRMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      const response = await apiRequest("POST", `/api/orders/scan-qr`, {
        qrCode,
        outletId: outlet?.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: outlet ? [`/api/outlet/${outlet.id}/orders`] : [] });
      toast({
        title: "Pickup Confirmed!",
        description: `Order completed successfully`,
      });
      setIsQRScannerOpen(false);
      setScannedQR("");
    },
    onError: (error: Error) => {
      toast({
        title: "Scan Failed",
        description: error.message || "Invalid QR code or order not ready",
        variant: "destructive",
      });
    },
  });

  // Toggle outlet chill period
  const toggleChillPeriodMutation = useMutation({
    mutationFn: async ({ activate, duration }: { activate: boolean; duration?: number }) => {
      if (!outlet) throw new Error("Outlet not found");
      const response = await apiRequest("PATCH", `/api/outlet-dashboard/chill-period`, {
        outletId: outlet.id,
        isChillPeriod: activate,
        duration: duration || 30, // default 30 minutes
      });
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/outlet/my"] });
      toast({
        title: "Success",
        description: variables.activate 
          ? `Chill period activated for ${variables.duration || 30} minutes` 
          : "Chill period deactivated",
      });
      setIsChillDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk add dishes from menu extraction
  const bulkAddDishesMutation = useMutation({
    mutationFn: async (dishes: any[]) => {
      if (!outlet) throw new Error("Outlet not found");
      const promises = dishes.map(dish =>
        apiRequest("POST", "/api/dishes", {
          outletId: outlet.id,
          name: dish.name,
          description: dish.description || "",
          price: dish.price,
          category: dish.category || "main_course",
          isVeg: dish.isVeg ?? true,
          isAvailable: true,
          calories: dish.calories || null,
          protein: dish.protein || null,
          carbs: dish.carbs || null,
          sugar: dish.sugar || null,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/outlets/${outlet?.id}/dishes`] });
      toast({
        title: "Success",
        description: `${extractedDishes.length} dishes added successfully`,
      });
      setExtractedDishes([]);
      setMenuImageUrl("");
      setIsAddDishOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Menu photo upload handlers
  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/object-storage/upload-url", {
      fileName: `menu-${Date.now()}.jpg`,
      contentType: "image/jpeg",
    });
    const data: any = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadUrl,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]) {
      const uploadedUrl = result.successful[0].uploadURL || "";
      setMenuImageUrl(uploadedUrl);
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
          description: "Could not extract menu from the photo. Please try again or add dishes manually.",
          variant: "destructive",
        });
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const handleDishSubmit = (values: DishFormValues) => {
    if (editingDish) {
      editDishMutation.mutate({ ...values, id: editingDish.id });
    } else {
      addDishMutation.mutate(values);
    }
  };

  const openEditDialog = (dish: Dish) => {
    setEditingDish(dish);
    form.reset({
      name: dish.name,
      description: dish.description || "",
      price: dish.price.toString(),
      category: dish.category as any,
      isVeg: dish.isVeg,
      isAvailable: dish.isAvailable,
      calories: dish.calories?.toString() || "",
      protein: dish.protein?.toString() || "",
      carbs: dish.carbs?.toString() || "",
      sugar: dish.sugar?.toString() || "",
    });
  };

  // Calculate statistics
  const activeOrders = orders.filter(o => o.status === "placed" || o.status === "preparing").length;
  const todaysRevenue = orders
    .filter(o => o.createdAt && new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center gap-3">
            <Store className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{outlet?.name || "Outlet Dashboard"}</h1>
              <p className="text-xs text-muted-foreground">{outlet?.description}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {outlet?.isChillPeriod && outlet?.chillPeriodEndsAt && (
              <ChillPeriodTimer endsAt={new Date(outlet.chillPeriodEndsAt)} />
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsQRScannerOpen(true)}
              data-testid="button-scan-qr"
            >
              <ScanLine className="w-4 h-4 mr-2" />
              Scan QR
            </Button>
            <Button
              variant={outlet?.isChillPeriod ? "destructive" : "outline"}
              size="sm"
              onClick={() => {
                if (outlet?.isChillPeriod) {
                  toggleChillPeriodMutation.mutate({ activate: false });
                } else {
                  setIsChillDialogOpen(true);
                }
              }}
              disabled={toggleChillPeriodMutation.isPending}
              data-testid="button-toggle-chill"
            >
              <Power className="w-4 h-4 mr-2" />
              {outlet?.isChillPeriod ? "Deactivate" : "Activate"} Chill Period
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeOrders}</div>
              <p className="text-xs text-muted-foreground">Orders in queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
              <ChefHat className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dishes.length}</div>
              <p className="text-xs text-muted-foreground">{dishes.filter(d => d.isAvailable).length} available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{todaysRevenue}</div>
              <p className="text-xs text-muted-foreground">Total sales today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Price</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{outlet?.averagePrice || 0}</div>
              <p className="text-xs text-muted-foreground">Per dish</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Menu Items</CardTitle>
                  <CardDescription>Manage your outlet's dishes and availability</CardDescription>
                </div>
                <Dialog open={isAddDishOpen || !!editingDish} onOpenChange={(open) => {
                  if (!open) {
                    setIsAddDishOpen(false);
                    setEditingDish(null);
                    form.reset();
                  } else {
                    setIsAddDishOpen(true);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-dish">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Dish
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingDish ? "Edit" : "Add"} Dish</DialogTitle>
                      <DialogDescription>
                        {editingDish ? "Update the dish details" : "Add a new dish to your menu"}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Menu Photo Upload Section - Only for adding new dishes */}
                    {!editingDish && !menuImageUrl && extractedDishes.length === 0 && (
                      <div className="space-y-4 border-b pb-4">
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
                                  Upload a photo of your menu to automatically add multiple dishes at once
                                </p>
                                <Button type="button" variant="outline" onClick={browseFiles} data-testid="button-upload-menu">
                                  <Upload className="w-4 h-4 mr-2" />
                                  Choose Menu Photo
                                </Button>
                              </div>
                            )}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Or skip this and add dishes manually one by one below
                        </p>
                      </div>
                    )}

                    {/* Extraction Status */}
                    {isExtracting && (
                      <div className="flex items-center justify-center py-6 gap-2 border-b pb-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm">Extracting dishes from menu photo...</span>
                      </div>
                    )}

                    {/* Extracted Dishes Preview */}
                    {extractedDishes.length > 0 && (
                      <div className="space-y-4 border-b pb-4">
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
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={() => bulkAddDishesMutation.mutate(extractedDishes)}
                            disabled={bulkAddDishesMutation.isPending}
                            className="flex-1"
                            data-testid="button-add-extracted-dishes"
                          >
                            {bulkAddDishesMutation.isPending ? "Adding..." : `Add All ${extractedDishes.length} Dishes`}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setExtractedDishes([]);
                              setMenuImageUrl("");
                            }}
                            data-testid="button-cancel-extraction"
                          >
                            Cancel
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Or add a single dish manually below
                        </p>
                      </div>
                    )}

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleDishSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-dish-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price (₹)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} data-testid="input-dish-price" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} data-testid="input-dish-description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-dish-category">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="appetizer">Appetizer</SelectItem>
                                  <SelectItem value="main_course">Main Course</SelectItem>
                                  <SelectItem value="dessert">Dessert</SelectItem>
                                  <SelectItem value="beverage">Beverage</SelectItem>
                                  <SelectItem value="snacks">Snacks</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="isVeg"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Vegetarian
                                  </FormLabel>
                                  <FormDescription>
                                    Is this a vegetarian dish?
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-dish-veg"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="isAvailable"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Available
                                  </FormLabel>
                                  <FormDescription>
                                    Is this dish available now?
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-dish-available"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Nutrition Information (Optional)</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="calories"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Calories</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} placeholder="kcal" data-testid="input-dish-calories" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="protein"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Protein (g)</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} placeholder="grams" data-testid="input-dish-protein" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="carbs"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Carbs (g)</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} placeholder="grams" data-testid="input-dish-carbs" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="sugar"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sugar (g)</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} placeholder="grams" data-testid="input-dish-sugar" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsAddDishOpen(false);
                              setEditingDish(null);
                              form.reset();
                            }}
                            data-testid="button-cancel-dish"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={addDishMutation.isPending || editDishMutation.isPending}
                            data-testid="button-save-dish"
                          >
                            {editingDish ? "Update" : "Add"} Dish
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {dishesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading dishes...</div>
                ) : dishes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No dishes added yet</p>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDishOpen(true)}
                      data-testid="button-add-first-dish"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add your first dish
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {dishes.map((dish) => {
                      const Icon = categoryIcons[dish.category as keyof typeof categoryIcons] || Package;
                      return (
                        <Card key={dish.id} className={!dish.isAvailable ? "opacity-60" : ""}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Icon className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{dish.name}</h3>
                                  <Badge variant={dish.isVeg ? "outline" : "destructive"}>
                                    {dish.isVeg ? <Leaf className="w-3 h-3 mr-1" /> : null}
                                    {dish.isVeg ? "Veg" : "Non-Veg"}
                                  </Badge>
                                  {!dish.isAvailable && (
                                    <Badge variant="secondary">Unavailable</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{dish.description}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="font-semibold text-lg">₹{dish.price}</span>
                                  {dish.calories && (
                                    <span className="text-xs text-muted-foreground">
                                      {dish.calories} kcal
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(dish)}
                                data-testid={`button-edit-dish-${dish.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this dish?")) {
                                    deleteDishMutation.mutate(dish.id);
                                  }
                                }}
                                data-testid={`button-delete-dish-${dish.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            {/* Pending Orders - Needs Confirmation */}
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <Card className="border-yellow-200 dark:border-yellow-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-600" />
                    <CardTitle>New Orders - Awaiting Confirmation</CardTitle>
                  </div>
                  <CardDescription>Confirm these orders to start preparing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.filter(o => o.status === 'pending').map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Confirmed Orders */}
            {orders.filter(o => o.status === 'confirmed').length > 0 && (
              <Card className="border-blue-200 dark:border-blue-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <CardTitle>Confirmed Orders</CardTitle>
                  </div>
                  <CardDescription>Ready to start preparing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.filter(o => o.status === 'confirmed').map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preparing Orders */}
            {orders.filter(o => o.status === 'preparing').length > 0 && (
              <Card className="border-orange-200 dark:border-orange-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-orange-600" />
                    <CardTitle>Preparing Orders</CardTitle>
                  </div>
                  <CardDescription>Currently being prepared</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.filter(o => o.status === 'preparing').map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ready Orders */}
            {orders.filter(o => o.status === 'ready').length > 0 && (
              <Card className="border-green-200 dark:border-green-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    <CardTitle>Ready for Pickup</CardTitle>
                  </div>
                  <CardDescription>Waiting for customer pickup</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.filter(o => o.status === 'ready').map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completed Orders */}
            {orders.filter(o => o.status === 'completed').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Completed Orders</CardTitle>
                  <CardDescription>Recently completed orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.filter(o => o.status === 'completed').slice(0, 5).map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {orders.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No orders yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Scanner Dialog */}
      <Dialog open={isQRScannerOpen} onOpenChange={setIsQRScannerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Student QR Code</DialogTitle>
            <DialogDescription>
              Ask student to show their order QR code. Enter the code below to confirm pickup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="qr-input">QR Code</Label>
              <Input
                id="qr-input"
                value={scannedQR}
                onChange={(e) => setScannedQR(e.target.value)}
                placeholder="ORDER-xxxxx-xxxx-xxxx-xxxx"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && scannedQR) {
                    scanQRMutation.mutate(scannedQR);
                  }
                }}
                data-testid="input-scan-qr"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Student will show QR code on their phone when picking up order
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsQRScannerOpen(false);
                  setScannedQR("");
                }}
                className="flex-1"
                data-testid="button-cancel-scan"
              >
                Cancel
              </Button>
              <Button
                onClick={() => scanQRMutation.mutate(scannedQR)}
                disabled={scanQRMutation.isPending || !scannedQR}
                className="flex-1"
                data-testid="button-confirm-scan"
              >
                {scanQRMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Pickup
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chill Period Dialog */}
      <Dialog open={isChillDialogOpen} onOpenChange={setIsChillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Chill Period</DialogTitle>
            <DialogDescription>
              Stop accepting new orders temporarily. Set how long you need to chill.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="5"
                max="480"
                value={chillDuration}
                onChange={(e) => setChillDuration(e.target.value)}
                placeholder="30"
                data-testid="input-chill-duration"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 30-60 minutes for breaks, up to 8 hours max
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsChillDialogOpen(false)}
                className="flex-1"
                data-testid="button-cancel-chill"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const duration = parseInt(chillDuration) || 30;
                  toggleChillPeriodMutation.mutate({ activate: true, duration });
                }}
                disabled={toggleChillPeriodMutation.isPending || !chillDuration}
                className="flex-1"
                data-testid="button-confirm-chill"
              >
                {toggleChillPeriodMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}