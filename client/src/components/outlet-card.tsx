import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, IndianRupee, Utensils } from "lucide-react";
import type { Outlet } from "@shared/schema";

interface OutletCardProps {
  outlet: Outlet & { dishCount?: number };
  onClick: () => void;
}

export function OutletCard({ outlet, onClick }: OutletCardProps) {
  const isChillPeriod = outlet.isChillPeriod && outlet.chillPeriodEndsAt && new Date(outlet.chillPeriodEndsAt) > new Date();

  return (
    <Card 
      className="cursor-pointer hover-elevate active-elevate-2 relative overflow-hidden"
      onClick={onClick}
      data-testid={`card-outlet-${outlet.id}`}
    >
      {isChillPeriod && (
        <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
          <div className="text-center text-white">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">Chill Period</p>
            <p className="text-sm">Preparing orders...</p>
          </div>
        </div>
      )}
      
      <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
        {outlet.imageUrl ? (
          <img 
            src={outlet.imageUrl} 
            alt={outlet.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Utensils className="w-16 h-16" />
          </div>
        )}
      </div>
      
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-1" data-testid={`text-outlet-name-${outlet.id}`}>
            {outlet.name}
          </h3>
          <div className="flex items-center gap-1 text-sm flex-shrink-0">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{Number(outlet.rating).toFixed(1)}</span>
          </div>
        </div>
        
        {outlet.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {outlet.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <IndianRupee className="w-4 h-4" />
            <span>₹{outlet.averagePrice} avg</span>
          </div>
          
          {outlet.dishCount !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {outlet.dishCount} items
            </Badge>
          )}
        </div>

        {!isChillPeriod && outlet.activeOrdersCount > outlet.maxActiveOrders * 0.7 && (
          <Badge variant="outline" className="text-xs w-full justify-center">
            <Clock className="w-3 h-3 mr-1" />
            Busy - Longer wait time
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
