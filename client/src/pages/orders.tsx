import { useQuery, useMutation } from "@tanstack/react-query";
import { OrderCard } from "@/components/order-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";

type OrderWithDetails = Order & { 
  outletName: string; 
  itemCount: number;
};

export default function Orders() {
  const [filter, setFilter] = useState<'active' | 'completed'>('active');
  const [ratingOpen, setRatingOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [reviewText, setReviewText] = useState("");
  const [alreadyRated, setAlreadyRated] = useState(false);
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ['/api/orders'],
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });

  const activeOrders = orders?.filter(
    o => o.status !== 'completed' && o.status !== 'cancelled'
  ) || [];

  const completedOrders = orders?.filter(
    o => o.status === 'completed' || o.status === 'cancelled'
  ) || [];

  const displayOrders = filter === 'active' ? activeOrders : completedOrders;

  const checkRated = async (order: Order) => {
    const res = await fetch(`/api/orders/${order.id}/rating`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      return !!data;
    }
    return false;
  };

  const ratingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) throw new Error('No order selected');
      await apiRequest('POST', '/api/ratings', {
        orderId: selectedOrder.id,
        outletId: (selectedOrder as any).outletId,
        rating: ratingValue,
        review: reviewText,
      });
    },
    onSuccess: () => {
      toast({ title: 'Thanks for the review!', description: '+5 tokens added to your balance' });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setRatingOpen(false);
      setSelectedOrder(null);
      setRatingValue(5);
      setReviewText("");
    },
    onError: (e: Error) => {
      toast({ title: 'Failed to submit review', description: e.message, variant: 'destructive' });
    },
  });

  const openRating = async (order: Order) => {
    const rated = await checkRated(order);
    setAlreadyRated(rated);
    setSelectedOrder(order);
    setRatingOpen(true);
  };

  // Auto-open rating dialog if redirected with ?rate=orderId
  useEffect(() => {
    if (!orders || orders.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const rateId = params.get('rate');
    if (rateId) {
      const target = orders.find(o => o.id === rateId);
      if (target) {
        // Ensure we are on completed tab to show context
        setFilter('completed');
        openRating(target);
        // Clean the query param without reload
        const url = new URL(window.location.href);
        url.searchParams.delete('rate');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [orders]);

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
              <div key={order.id} className="space-y-2">
                <OrderCard order={order} />
                {(order.status === 'completed') && (
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => openRating(order)} data-testid={`button-rate-${order.id}`}>
                      Rate Order
                    </Button>
                  </div>
                )}
              </div>
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
      {/* Rating Dialog */}
      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate your order</DialogTitle>
            <DialogDescription>
              Share your feedback and earn tokens.
            </DialogDescription>
          </DialogHeader>

          {alreadyRated ? (
            <div className="p-4 bg-muted rounded text-sm">You have already rated this order.</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map((n) => (
                  <button
                    key={n}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center ${n <= ratingValue ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    onClick={() => setRatingValue(n)}
                    aria-label={`Rate ${n}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Write a quick review (optional)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRatingOpen(false)}>Cancel</Button>
            <Button onClick={() => ratingMutation.mutate()} disabled={alreadyRated || ratingMutation.isPending}>
              {ratingMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
