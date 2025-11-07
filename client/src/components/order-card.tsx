import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, IndianRupee } from "lucide-react";
import type { Order } from "@shared/schema";
import { QRCodeSVG } from "qrcode.react";

interface OrderCardProps {
  order: Order & { outletName?: string; itemCount?: number };
  onViewDetails?: () => void;
}

export function OrderCard({ order, onViewDetails }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed': return 'bg-blue-500';
      case 'preparing': return 'bg-yellow-500';
      case 'ready': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const showQR = order.status === 'ready';

  return (
    <Card data-testid={`card-order-${order.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg" data-testid={`text-outlet-${order.id}`}>
              {order.outletName || 'Outlet'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {order.itemCount || 0} items • ₹{order.totalAmount}
            </p>
          </div>
          <Badge className={getStatusColor(order.status)} data-testid={`badge-status-${order.id}`}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Placed</span>
            <span>Preparing</span>
            <span>Ready</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden flex">
            <div className={`h-full ${order.status !== 'cancelled' ? 'bg-primary' : 'bg-destructive'} transition-all`} 
                 style={{ 
                   width: order.status === 'placed' ? '33%' : 
                          order.status === 'preparing' ? '66%' : 
                          order.status === 'ready' || order.status === 'completed' ? '100%' : 
                          '100%' 
                 }} 
            />
          </div>
        </div>

        {order.estimatedReadyTime && order.status !== 'completed' && order.status !== 'cancelled' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Ready by {new Date(order.estimatedReadyTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}

        {order.specialInstructions && (
          <div className="text-sm">
            <span className="font-medium">Special Instructions: </span>
            <span className="text-muted-foreground">{order.specialInstructions}</span>
          </div>
        )}

        {showQR && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-center">Show this QR at pickup</p>
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG value={order.qrCode} size={120} />
              </div>
            </div>
          </div>
        )}

        {onViewDetails && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onViewDetails}
            data-testid={`button-view-order-${order.id}`}
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
