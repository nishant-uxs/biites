import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, IndianRupee, Coffee, Cake, UtensilsCrossed } from "lucide-react";
import type { Dish } from "@shared/schema";
import { NutritionMeter } from "./nutrition-meter";

interface DishCardProps {
  dish: Dish;
  onAdd: () => void;
  showNutrition?: boolean;
}

export function DishCard({ dish, onAdd, showNutrition = false }: DishCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'beverage':
        return <Coffee className="w-12 h-12 text-muted-foreground" />;
      case 'dessert':
        return <Cake className="w-12 h-12 text-muted-foreground" />;
      default:
        return <UtensilsCrossed className="w-12 h-12 text-muted-foreground" />;
    }
  };

  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-dish-${dish.id}`}>
      <div className="aspect-square bg-muted overflow-hidden">
        {dish.imageUrl ? (
          <img 
            src={dish.imageUrl} 
            alt={dish.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getCategoryIcon(dish.category)}
          </div>
        )}
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-1" data-testid={`text-dish-name-${dish.id}`}>
              {dish.name}
            </h3>
            {dish.isCustomizable && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                Customizable
              </Badge>
            )}
          </div>
          
          {dish.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {dish.description}
            </p>
          )}
        </div>

        {showNutrition && dish.calories && (
          <NutritionMeter
            calories={dish.calories}
            protein={dish.protein || 0}
            carbs={dish.carbs || 0}
            sugar={dish.sugar || 0}
          />
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-1">
            <IndianRupee className="w-5 h-5 text-primary" />
            <span className="text-xl font-bold font-accent" data-testid={`text-price-${dish.id}`}>
              {dish.price}
            </span>
          </div>
          
          <Button
            size="sm"
            onClick={onAdd}
            data-testid={`button-add-dish-${dish.id}`}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
