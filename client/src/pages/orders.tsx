import { useQuery } from "@tanstack/react-query";
import { OrderCard } from "@/components/order-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { Order } from "@shared/schema";

type OrderWithDetails = Order & { 
  outletName: string; 
  itemCount: number;
};

export default function Orders() {
  const [filter, setFilter] = useState<'active' | 'completed'>('active');

  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ['/api/orders'],
  });

  const activeOrders = orders?.filter(
    o => o.status !== 'completed' && o.status !== 'cancelled'
  ) || [];

  const completedOrders = orders?.filter(
    o => o.status === 'completed' || o.status === 'cancelled'
  ) || [];

  const displayOrders = filter === 'active' ? activeOrders : completedOrders;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-card-border">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          <h1 className="text-2xl font-bold">My Orders</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            onClick={() => setFilter('active')}
            data-testid="button-filter-active"
            className="flex-1"
          >
            Active
            {activeOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeOrders.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
            data-testid="button-filter-completed"
            className="flex-1"
          >
            Completed
          </Button>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : displayOrders.length > 0 ? (
          <div className="space-y-4">
            {displayOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No {filter} orders</h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'active' 
                  ? "Place an order to see it here!" 
                  : "Your order history will appear here"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
