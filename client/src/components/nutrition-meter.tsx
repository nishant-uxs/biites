import { Badge } from "@/components/ui/badge";
import { Flame, Beef, Wheat, Candy } from "lucide-react";

interface NutritionMeterProps {
  calories: number;
  protein: number;
  carbs: number;
  sugar: number;
}

export function NutritionMeter({ calories, protein, carbs, sugar }: NutritionMeterProps) {
  const getNutritionLevel = (value: number, type: 'calories' | 'protein' | 'carbs' | 'sugar') => {
    const thresholds = {
      calories: { low: 200, high: 400 },
      protein: { low: 10, high: 20 },
      carbs: { low: 30, high: 60 },
      sugar: { low: 10, high: 20 },
    };
    
    const { low, high } = thresholds[type];
    if (value < low) return 'low';
    if (value > high) return 'high';
    return 'medium';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const nutrients = [
    { icon: Flame, label: 'Cal', value: calories, unit: 'kcal', type: 'calories' as const },
    { icon: Beef, label: 'Protein', value: protein, unit: 'g', type: 'protein' as const },
    { icon: Wheat, label: 'Carbs', value: carbs, unit: 'g', type: 'carbs' as const },
    { icon: Candy, label: 'Sugar', value: sugar, unit: 'g', type: 'sugar' as const },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {nutrients.map(({ icon: Icon, label, value, unit, type }) => {
        const level = getNutritionLevel(value, type);
        const color = getLevelColor(level);
        
        return (
          <div key={type} className="text-center space-y-1">
            <div className="relative">
              <Icon className="w-4 h-4 mx-auto text-muted-foreground" />
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${color}`} />
            </div>
            <p className="text-xs font-medium">{value}{unit}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        );
      })}
    </div>
  );
}
