import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DishCard } from "@/components/dish-card";
import { ArrowLeft, ShoppingCart, Star, Clock, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Outlet, Dish } from "@shared/schema";

type CartItem = {
  dish: Dish;
  quantity: number;
  customizations: string;
};

export default function OutletDetail() {
  const [, params] = useRoute("/outlet/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const outletId = params?.id;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { data: outlet } = useQuery<Outlet>({
    queryKey: ['/api/outlets', outletId],
    enabled: !!outletId,
  });

  const { data: dishes = [] } = useQuery<Dish[]>({
    queryKey: ['/api/outlets', outletId, 'dishes'],
    enabled: !!outletId,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest('POST', '/api/orders', orderData);
      return res.json();
    },
    onSuccess: (order: any) => {
      toast({
        title: "Order Placed!",
        description: "Your order is being prepared",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setCart([]);
      setSpecialInstructions("");
      setShowCheckout(false);
      if (order?.id) {
        setLocation(`/orders?rate=${order.id}`);
      } else {
        setLocation('/orders');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addToCart = (dish: Dish) => {
    if (outlet?.isChillPeriod) {
      toast({
        title: "Outlet is in Chill Period",
        description: "Ordering is temporarily paused. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    const existing = cart.find(item => item.dish.id === dish.id);
    if (existing) {
      setCart(cart.map(item =>
        item.dish.id === dish.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { dish, quantity: 1, customizations: "" }]);
    }
    toast({
      title: "Added to cart",
      description: dish.name,
    });
  };

  const updateQuantity = (dishId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.dish.id === dishId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return null as any;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0);
  const upfrontAmount = Math.round(totalAmount * 0.4);
  const remainingAmount = Math.max(totalAmount - upfrontAmount, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = () => {
    if (outlet?.isChillPeriod) {
      toast({
        title: "Chill Period Active",
        description: "This outlet is temporarily paused. You cannot place orders right now.",
        variant: "destructive",
      });
    }
    if (cart.length === 0) return;

    createOrderMutation.mutate({
      outletId,
      items: cart.map(item => ({
        dishId: item.dish.id,
        quantity: item.quantity,
        customizations: item.customizations,
        price: item.dish.price,
      })),
      specialInstructions,
      totalAmount,
    });
  };

  const handleOpenPayment = () => {
    if (outlet?.isChillPeriod) {
      toast({
        title: "Chill Period Active",
        description: "Ordering is paused during the chill period.",
        variant: "destructive",
      });
      return;
    }
    if (cart.length === 0) return;
    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = async () => {
    try {
      setIsProcessingPayment(true);
      // Simulate payment delay
      await new Promise((r) => setTimeout(r, 1000));
      toast({
        title: "Payment successful",
        description: `₹${upfrontAmount} (40%) paid. Remaining ₹${remainingAmount} to be paid at pickup/delivery`,
      });
      setShowPaymentDialog(false);
      handlePlaceOrder();
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (!outlet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const categories = Array.from(new Set(dishes.map(d => d.category)));

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-card-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-7xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          {cart.length > 0 && (
            <Button
              onClick={() => setShowCheckout(!showCheckout)}
              data-testid="button-view-cart"
              className="relative"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Cart ({cartItemsCount})
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-2 -right-2">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
          )}
        </div>
        {/* Chill period banner */}
        {outlet?.isChillPeriod && outlet?.chillPeriodEndsAt && (
          <div className="bg-destructive/10 border-y border-destructive">
            <div className="container mx-auto px-4 py-2 max-w-7xl flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Chill Period Active</span>
              <span className="ml-auto">
                Ends at {new Date(outlet.chillPeriodEndsAt).toLocaleTimeString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        {/* Outlet Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {outlet.imageUrl ? (
                  <img src={outlet.imageUrl} alt={outlet.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{outlet.name}</h1>
                {outlet.description && (
                  <p className="text-muted-foreground mb-3">{outlet.description}</p>
                )}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{Number(outlet.rating).toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span>₹{outlet.averagePrice} avg</span>
                  </div>
                  {outlet.isChillPeriod && (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Chill Period Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu */}
        <div className="space-y-6">
          {categories.map(category => {
            const categoryDishes = dishes.filter(d => d.category === category);
            return (
              <div key={category}>
                <h2 className="text-2xl font-semibold mb-4 capitalize">{category}s</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categoryDishes.map(dish => (
                    <DishCard
                      key={dish.id}
                      dish={dish}
                      onAdd={() => addToCart(dish)}
                      showNutrition={true}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart/Checkout */}
        {showCheckout && cart.length > 0 && (
          <Card className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto shadow-2xl">
            <CardHeader>
              <CardTitle>Your Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.dish.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div className="flex-1">
                      <p className="font-medium">{item.dish.name}</p>
                      <p className="text-sm text-muted-foreground">₹{item.dish.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.dish.id, -1)}
                        data-testid={`button-decrease-${item.dish.id}`}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.dish.id, 1)}
                        data-testid={`button-increase-${item.dish.id}`}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Textarea
                placeholder="Special instructions (e.g., No onion, Extra cheese)"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={2}
                data-testid="textarea-special-instructions"
              />

              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{totalAmount}</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleOpenPayment}
                disabled={createOrderMutation.isPending || !!outlet?.isChillPeriod}
                data-testid="button-place-order"
              >
                {createOrderMutation.isPending ? "Placing Order..." : outlet?.isChillPeriod ? "Chill Period Active" : "Place Order"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pay 40% to confirm</DialogTitle>
              <DialogDescription>
                We will collect the remaining amount at pickup/delivery.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span className="font-semibold">₹{totalAmount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Upfront (40%)</span>
                <span className="font-semibold">₹{upfrontAmount}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Remaining</span>
                <span>₹{remainingAmount}</span>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                disabled={isProcessingPayment}
                data-testid="button-cancel-payment"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPayment}
                disabled={isProcessingPayment}
                data-testid="button-confirm-payment"
              >
                {isProcessingPayment ? "Processing..." : `Pay ₹${upfrontAmount}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

