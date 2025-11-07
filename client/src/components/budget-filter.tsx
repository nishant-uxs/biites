import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndianRupee } from "lucide-react";

interface BudgetFilterProps {
  onBudgetChange: (budget: number | null) => void;
  currentBudget: number | null;
}

export function BudgetFilter({ onBudgetChange, currentBudget }: BudgetFilterProps) {
  const [budget, setBudget] = useState(currentBudget?.toString() || "");

  const quickBudgets = [50, 100, 150, 200];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseInt(budget);
    if (value > 0) {
      onBudgetChange(value);
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <IndianRupee className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Set Your Budget</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            ₹
          </span>
          <Input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Enter budget"
            className="pl-8 text-lg"
            data-testid="input-budget"
          />
        </div>
        <Button type="submit" data-testid="button-apply-budget">
          Apply
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {quickBudgets.map((amount) => (
          <Badge
            key={amount}
            variant={currentBudget === amount ? "default" : "secondary"}
            className="cursor-pointer hover-elevate active-elevate-2 px-3 py-1"
            onClick={() => {
              setBudget(amount.toString());
              onBudgetChange(amount);
            }}
            data-testid={`badge-budget-${amount}`}
          >
            ₹{amount}
          </Badge>
        ))}
        {currentBudget && (
          <Badge
            variant="outline"
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={() => {
              setBudget("");
              onBudgetChange(null);
            }}
            data-testid="badge-clear-budget"
          >
            Clear
          </Badge>
        )}
      </div>

      {currentBudget && (
        <p className="text-sm text-muted-foreground">
          Showing items within ₹{currentBudget}
        </p>
      )}
    </div>
  );
}
