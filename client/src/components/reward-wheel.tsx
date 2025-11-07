import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Coins } from "lucide-react";
import type { Reward } from "@shared/schema";

interface RewardWheelProps {
  rewards: Reward[];
  userTokens: number;
  onSpin: () => Promise<Reward>;
  spinCost: number;
}

export function RewardWheel({ rewards, userTokens, onSpin, spinCost }: RewardWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonReward, setWonReward] = useState<Reward | null>(null);

  const handleSpin = async () => {
    if (userTokens < spinCost || isSpinning) return;
    
    setIsSpinning(true);
    setWonReward(null);
    
    try {
      const reward = await onSpin();
      
      // Simulate spin animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setWonReward(reward);
    } catch (error) {
      console.error('Spin failed:', error);
    } finally {
      setIsSpinning(false);
    }
  };

  const canSpin = userTokens >= spinCost && !isSpinning;

  return (
    <div className="space-y-6">
      {/* Token Display */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-primary/10 px-6 py-3 rounded-full">
          <Coins className="w-6 h-6 text-primary" />
          <span className="text-2xl font-bold font-accent">{userTokens}</span>
          <span className="text-sm text-muted-foreground">tokens</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {spinCost} tokens per spin
        </p>
      </div>

      {/* Wheel */}
      <div className="relative aspect-square max-w-sm mx-auto">
        <div 
          className={`w-full h-full rounded-full border-8 border-primary flex items-center justify-center transition-transform duration-2000 ${
            isSpinning ? 'animate-spin' : ''
          }`}
          style={{
            background: `conic-gradient(
              from 0deg,
              hsl(var(--primary)) 0deg ${360 / rewards.length}deg,
              hsl(var(--secondary)) ${360 / rewards.length}deg ${(360 / rewards.length) * 2}deg,
              hsl(var(--primary)) ${(360 / rewards.length) * 2}deg ${(360 / rewards.length) * 3}deg,
              hsl(var(--secondary)) ${(360 / rewards.length) * 3}deg ${(360 / rewards.length) * 4}deg,
              hsl(var(--primary)) ${(360 / rewards.length) * 4}deg ${(360 / rewards.length) * 5}deg,
              hsl(var(--secondary)) ${(360 / rewards.length) * 5}deg 360deg
            )`
          }}
        >
          <div className="w-32 h-32 rounded-full bg-card border-4 border-primary flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
        </div>
        
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-primary" />
        </div>
      </div>

      {/* Spin Button */}
      <div className="text-center space-y-4">
        <Button
          size="lg"
          onClick={handleSpin}
          disabled={!canSpin}
          className="px-8"
          data-testid="button-spin-wheel"
        >
          {isSpinning ? 'Spinning...' : `Spin (${spinCost} tokens)`}
        </Button>

        {!canSpin && userTokens < spinCost && (
          <p className="text-sm text-muted-foreground">
            Need {spinCost - userTokens} more tokens to spin
          </p>
        )}
      </div>

      {/* Won Reward */}
      {wonReward && (
        <div className="bg-primary/10 rounded-lg p-6 text-center space-y-2 border-2 border-primary animate-in fade-in slide-in-from-bottom-4">
          <p className="text-2xl">🎉</p>
          <h3 className="text-xl font-bold">You Won!</h3>
          <p className="text-lg font-semibold">{wonReward.title}</p>
          {wonReward.description && (
            <p className="text-sm text-muted-foreground">{wonReward.description}</p>
          )}
        </div>
      )}

      {/* Rewards List */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-muted-foreground">Possible Prizes:</h4>
        <div className="grid gap-2">
          {rewards.map((reward) => (
            <div key={reward.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">{reward.title}</span>
              <Badge variant="secondary" className="text-xs">
                {reward.probability}% chance
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
