import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { RewardWheel } from "@/components/reward-wheel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Trophy, Target, Gift } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Reward, Challenge } from "@shared/schema";

export default function Rewards() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: rewards = [] } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
  });

  const { data: challenges = [] } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges'],
  });

  const { data: userChallenges = [] } = useQuery<any[]>({
    queryKey: ['/api/challenges/progress'],
  });

  const { data: claims = [] } = useQuery<any[]>({
    queryKey: ['/api/rewards/claims'],
  });

  const spinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/rewards/spin', {});
      return response.json();
    },
    onSuccess: (reward) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      return reward;
    },
    onError: (error: Error) => {
      toast({
        title: "Spin Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    },
  });

  const handleSpin = async (): Promise<Reward> => {
    const reward = await spinMutation.mutateAsync();
    return reward;
  };

  const userTokens = user?.tokens || 0;
  const spinCost = 20;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-card-border">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          <h1 className="text-2xl font-bold">Rewards</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-8">
        {/* Token Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              Your Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-accent text-primary">
              {userTokens}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Earn tokens by rating orders and completing challenges
            </p>
          </CardContent>
        </Card>

        {/* Reward Wheel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Spin the Wheel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RewardWheel
              rewards={rewards}
              userTokens={userTokens}
              onSpin={handleSpin}
              spinCost={spinCost}
            />
          </CardContent>
        </Card>

        {/* Recent Rewards / Claims */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Recent Wins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {claims.length > 0 ? (
              <div className="space-y-2">
                {claims.slice(0, 8).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium">{c.rewardTitle || c.reward?.title || 'Reward'}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                    <Badge variant={c.isUsed ? 'secondary' : 'default'} className="text-xs">
                      {c.isUsed ? 'Used' : 'Unused'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No wins yet. Spin the wheel to get your first reward!</div>
            )}
          </CardContent>
        </Card>

        {/* Challenges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Challenges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {challenges.length > 0 ? (
              challenges.map((challenge) => {
                const progress = userChallenges.find(uc => uc.challengeId === challenge.id);
                const currentProgress = progress?.progress || 0;
                const percentage = Math.min((currentProgress / challenge.requirement) * 100, 100);
                const isCompleted = currentProgress >= challenge.requirement;

                return (
                  <div key={challenge.id} className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold">{challenge.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {challenge.description}
                        </p>
                      </div>
                      <Badge variant={isCompleted ? "default" : "secondary"}>
                        +{challenge.rewardTokens} tokens
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {currentProgress} / {challenge.requirement}
                        </span>
                        <span className="font-medium">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    
                    {isCompleted && (
                      <Badge variant="default" className="w-full justify-center">
                        ✓ Completed!
                      </Badge>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No active challenges</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
