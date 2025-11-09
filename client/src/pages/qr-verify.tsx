import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, CheckCircle, Package, MapPin, Clock, IndianRupee, Loader2 } from "lucide-react";
import type { Order, OrderItem, Outlet } from "@shared/schema";
import { useLocation } from "wouter";

type OrderVerificationResponse = {
  order: Order;
  items: (OrderItem & { dishName: string })[];
  outlet: Outlet;
};

export default function QRVerify() {
  const [qrCode, setQrCode] = useState("");
  const [verifiedOrder, setVerifiedOrder] = useState<OrderVerificationResponse | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("GET", `/api/orders/verify/${code}`);
      return await response.json();
    },
    onSuccess: (data: OrderVerificationResponse) => {
      setVerifiedOrder(data);
      toast({
        title: "Order verified!",
        description: "Your order details are shown below",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid QR code or you don't have permission",
        variant: "destructive",
      });
    },
  });

  const confirmPickupMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/confirm-pickup`);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Pickup confirmed!",
        description: data.message || "Enjoy your meal!",
      });
      setTimeout(() => {
        setLocation("/orders");
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Confirmation failed",
        description: error.message || "Failed to confirm pickup",
        variant: "destructive",
      });
    },
  });

  const handleVerify = () => {
    if (!qrCode.trim()) {
      toast({
        title: "Enter QR code",
        description: "Please enter the QR code shown by the outlet",
        variant: "destructive",
      });
      return;
    }
    verifyMutation.mutate(qrCode.trim());
  };

  const handleConfirmPickup = () => {
    if (verifiedOrder) {
      confirmPickupMutation.mutate(verifiedOrder.order.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-card-border">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-primary" />
            Verify Pickup
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        {/* QR Code Input Card */}
        {!verifiedOrder && (
          <Card>
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>
                Enter the QR code shown by the outlet to verify your pickup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-code">QR Code</Label>
                <Input
                  id="qr-code"
                  placeholder="ORDER-xxxxx-xxxx-xxxx-xxxx"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleVerify();
                    }
                  }}
                  data-testid="input-qr-code"
                />
                <p className="text-xs text-muted-foreground">
                  Ask the outlet staff to show you the QR code for your order
                </p>
              </div>

              <Button
                onClick={handleVerify}
                disabled={verifyMutation.isPending}
                className="w-full"
                data-testid="button-verify-qr"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ScanLine className="w-4 h-4 mr-2" />
                    Verify Order
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Order Details Card */}
        {verifiedOrder && (
          <div className="space-y-4">
            {/* Status Badge */}
            <Card className={`border-2 ${verifiedOrder.order.status === 'ready' ? 'border-green-500' : 'border-yellow-500'}`}>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(verifiedOrder.order.status)} text-white font-semibold`}>
                    {verifiedOrder.order.status === 'ready' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                    Order {verifiedOrder.order.status === 'ready' ? 'Ready for Pickup!' : 'Being Prepared'}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Order ID: {verifiedOrder.order.id.slice(0, 8)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Outlet Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Pickup Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold text-lg">{verifiedOrder.outlet.name}</p>
                  {verifiedOrder.outlet.description && (
                    <p className="text-sm text-muted-foreground">{verifiedOrder.outlet.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {verifiedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{item.dishName}</p>
                        {item.customizations && (
                          <p className="text-xs text-muted-foreground">
                            {item.customizations}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        {item.price * item.quantity}
                      </p>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-3 border-t-2">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-xl flex items-center text-primary">
                      <IndianRupee className="w-4 h-4" />
                      {verifiedOrder.order.totalAmount}
                    </span>
                  </div>

                  <div className="pt-2">
                    <Badge variant="outline">
                      {verifiedOrder.order.paymentMethod === 'cash' ? 'Cash on Pickup' : 'UPI on Pickup'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Confirm Pickup Button */}
            {verifiedOrder.order.status === 'ready' && (
              <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <CardContent className="pt-6 space-y-4">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <h3 className="font-bold text-lg mb-1">Your order is ready!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Please collect your order and confirm pickup below
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleConfirmPickup}
                    disabled={confirmPickupMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                    data-testid="button-confirm-pickup"
                  >
                    {confirmPickupMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Confirm Pickup
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {verifiedOrder.order.status !== 'ready' && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Your order is being prepared. Please wait until it's ready for pickup.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Back Button */}
            <Button
              variant="outline"
              onClick={() => setVerifiedOrder(null)}
              className="w-full"
              data-testid="button-back"
            >
              Scan Another Order
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
