import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [showWinDialog, setShowWinDialog] = useState(false);
  const [confettiBursts, setConfettiBursts] = useState<number[]>([]);

  const handleSpin = async () => {
    if (userTokens < spinCost || isSpinning) return;
    
    setIsSpinning(true);
    setWonReward(null);
    
    try {
      const reward = await onSpin();
      
      // Simulate spin animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setWonReward(reward);
      setShowWinDialog(true);
      // Trigger simple confetti bursts (emoji-based to avoid deps)
      setConfettiBursts(Array.from({ length: 20 }, (_, i) => i));
      setTimeout(() => setConfettiBursts([]), 2500);
    } catch (error) {
      console.error('Spin failed:', error);
    } finally {
      setIsSpinning(false);
    }
  };

  const canSpin = userTokens >= spinCost && !isSpinning;

  return (
    <div className="space-y-6">
      {/* Confetti Layer */}
      {confettiBursts.length > 0 && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
          {confettiBursts.map((i) => (
            <div
              key={i}
              className="absolute text-2xl animate-[fall_2.5s_linear_forwards]"
              style={{
                left: `${(i * 7) % 100}%`,
                top: '-5%',
                transform: `rotate(${(i * 37) % 360}deg)`,
              }}
            >
              {['🎉','✨','🎊','💥','⭐','🍀'][i % 6]}
            </div>
          ))}
          <style>{`
            @keyframes fall {
              0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
              100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}
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

      {/* Won Reward Dialog */}
      <Dialog open={showWinDialog} onOpenChange={setShowWinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>🎉</span> Congratulations!
            </DialogTitle>
            <DialogDescription>
              You just won a reward from the wheel.
            </DialogDescription>
          </DialogHeader>
          {wonReward && (
            <div className="space-y-2 text-center">
              <div className="text-2xl font-bold">{wonReward.title}</div>
              {wonReward.description && (
                <p className="text-sm text-muted-foreground">{wonReward.description}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowWinDialog(false)} autoFocus>
              Awesome
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
