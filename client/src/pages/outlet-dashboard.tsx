import { useState } from "react";
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
import { Store, Plus, Edit, Trash2, Clock, Package, TrendingUp, Coffee, Soup, Pizza, Settings, Power, AlertCircle, ChefHat, DollarSign, Leaf } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Dish, Outlet, Order } from "@shared/schema";

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

export default function OutletDashboard() {
  const { user } = useAuth();
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");

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

  // Toggle outlet chill period
  const toggleChillPeriodMutation = useMutation({
    mutationFn: async () => {
      if (!outlet) throw new Error("Outlet not found");
      const response = await apiRequest("PATCH", `/api/outlets/${outlet.id}/chill-period`, {
        isChillPeriod: !outlet.isChillPeriod,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outlet/my"] });
      toast({
        title: "Success",
        description: outlet?.isChillPeriod ? "Chill period deactivated" : "Chill period activated",
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
            {outlet?.isChillPeriod && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                Chill Period Active
              </Badge>
            )}
            <Button
              variant={outlet?.isChillPeriod ? "destructive" : "outline"}
              size="sm"
              onClick={() => toggleChillPeriodMutation.mutate()}
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
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Manage and track your outlet's orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Order #{order.id.slice(-6)}</span>
                                <Badge variant={
                                  order.status === "completed" ? "default" :
                                  order.status === "placed" ? "secondary" :
                                  order.status === "preparing" ? "destructive" :
                                  "outline"
                                }>
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">₹{order.totalAmount}</p>
                              <p className="text-sm text-muted-foreground">{order.paymentMethod}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}