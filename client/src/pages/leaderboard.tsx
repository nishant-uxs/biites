import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Crown, Medal, Star, Target, Zap, 
  TrendingUp, Users, Award, Flame, ArrowUp, 
  ArrowDown, Minus, ChevronLeft
} from "lucide-react";
import { useLocation } from "wouter";

interface LeaderboardEntry {
  userId: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  tokens: number;
  badgeCount: number;
  orderCount: number;
  rank?: number;
  change?: 'up' | 'down' | 'same';
  changeAmount?: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'allTime'>('weekly');

  // Fetch leaderboard data
  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard', timeFrame],
  });

  // Find current user's rank
  const userRank = leaderboard.findIndex(entry => entry.userId === user?.id) + 1;
  const userEntry = leaderboard.find(entry => entry.userId === user?.id);

  // Get rank display elements
  const getRankDisplay = (rank: number) => {
    if (rank === 1) return {
      icon: <Crown className="w-5 h-5" />,
      color: "text-yellow-500",
      bg: "bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-900/10",
      border: "border-yellow-300 dark:border-yellow-700",
    };
    if (rank === 2) return {
      icon: <Medal className="w-5 h-5" />,
      color: "text-gray-400",
      bg: "bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900/20 dark:to-gray-900/10",
      border: "border-gray-300 dark:border-gray-700",
    };
    if (rank === 3) return {
      icon: <Medal className="w-5 h-5" />,
      color: "text-amber-600",
      bg: "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-900/10",
      border: "border-amber-300 dark:border-amber-700",
    };
    return {
      icon: <span className="text-sm font-bold">{rank}</span>,
      color: "text-muted-foreground",
      bg: "",
      border: "",
    };
  };

  const getChangeIcon = (change?: 'up' | 'down' | 'same', amount?: number) => {
    if (!change || change === 'same') {
      return <Minus className="w-3 h-3 text-gray-400" />;
    }
    if (change === 'up') {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <ArrowUp className="w-3 h-3" />
          {amount && <span className="text-xs">+{amount}</span>}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-red-600">
        <ArrowDown className="w-3 h-3" />
        {amount && <span className="text-xs">-{amount}</span>}
      </div>
    );
  };

  // Top 3 podium
  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b backdrop-blur-lg bg-opacity-95">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/")}
                data-testid="button-back"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Leaderboard</h1>
                <p className="text-xs text-muted-foreground">Campus Champions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1">
                <Trophy className="w-3 h-3" />
                Live Rankings
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Your Position Card */}
        {userEntry && (
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRankDisplay(userRank).bg} ${getRankDisplay(userRank).border} border-2`}>
                    {getRankDisplay(userRank).icon}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Position</p>
                    <p className="text-2xl font-bold">#{userRank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="text-2xl font-bold text-primary">{userEntry.tokens}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <span>{userEntry.badgeCount} Badges</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span>{userEntry.orderCount} Orders</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Frame Tabs */}
        <Tabs value={timeFrame} onValueChange={(value) => setTimeFrame(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="allTime">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={timeFrame} className="space-y-6 mt-6">
            {/* Top 3 Podium */}
            {top3.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Top Champions
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {/* 2nd Place */}
                  {top3[1] && (
                    <div className="mt-8">
                      <Card className={`${getRankDisplay(2).bg} ${getRankDisplay(2).border} border-2`}>
                        <CardContent className="p-3 text-center">
                          <div className="mb-2">{getRankDisplay(2).icon}</div>
                          <Avatar className="w-14 h-14 mx-auto mb-2 ring-2 ring-gray-400">
                            <AvatarImage src={top3[1].profileImageUrl || undefined} />
                            <AvatarFallback>{top3[1].firstName[0]}{top3[1].lastName[0]}</AvatarFallback>
                          </Avatar>
                          <p className="font-medium text-sm truncate">{top3[1].firstName}</p>
                          <p className="text-xs text-muted-foreground truncate">{top3[1].lastName}</p>
                          <p className="font-bold text-lg mt-1">{top3[1].tokens}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* 1st Place */}
                  {top3[0] && (
                    <div>
                      <Card className={`${getRankDisplay(1).bg} ${getRankDisplay(1).border} border-2 shadow-lg`}>
                        <CardContent className="p-3 text-center">
                          <div className="mb-2">{getRankDisplay(1).icon}</div>
                          <Avatar className="w-16 h-16 mx-auto mb-2 ring-2 ring-yellow-400">
                            <AvatarImage src={top3[0].profileImageUrl || undefined} />
                            <AvatarFallback>{top3[0].firstName[0]}{top3[0].lastName[0]}</AvatarFallback>
                          </Avatar>
                          <p className="font-medium text-sm truncate">{top3[0].firstName}</p>
                          <p className="text-xs text-muted-foreground truncate">{top3[0].lastName}</p>
                          <p className="font-bold text-xl mt-1">{top3[0].tokens}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {top3[2] && (
                    <div className="mt-8">
                      <Card className={`${getRankDisplay(3).bg} ${getRankDisplay(3).border} border-2`}>
                        <CardContent className="p-3 text-center">
                          <div className="mb-2">{getRankDisplay(3).icon}</div>
                          <Avatar className="w-14 h-14 mx-auto mb-2 ring-2 ring-amber-600">
                            <AvatarImage src={top3[2].profileImageUrl || undefined} />
                            <AvatarFallback>{top3[2].firstName[0]}{top3[2].lastName[0]}</AvatarFallback>
                          </Avatar>
                          <p className="font-medium text-sm truncate">{top3[2].firstName}</p>
                          <p className="text-xs text-muted-foreground truncate">{top3[2].lastName}</p>
                          <p className="font-bold text-lg mt-1">{top3[2].tokens}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Full Rankings */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                All Rankings
              </h2>
              <Card>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Loading rankings...</p>
                    </div>
                  ) : leaderboard.length > 0 ? (
                    <div className="divide-y">
                      {leaderboard.map((entry, index) => {
                        const rank = index + 1;
                        const rankDisplay = getRankDisplay(rank);
                        const isCurrentUser = entry.userId === user?.id;
                        
                        return (
                          <div
                            key={entry.userId}
                            className={`flex items-center gap-3 p-4 ${
                              isCurrentUser ? 'bg-primary/5' : ''
                            }`}
                            data-testid={`leaderboard-entry-${entry.userId}`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${rankDisplay.bg} ${rankDisplay.border} ${rank <= 3 ? 'border' : ''}`}>
                              <span className={rankDisplay.color}>
                                {rankDisplay.icon}
                              </span>
                            </div>
                            
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={entry.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {entry.firstName[0]}{entry.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <p className="font-medium">
                                {entry.firstName} {entry.lastName}
                                {isCurrentUser && (
                                  <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                                )}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{entry.orderCount} orders</span>
                                <span>{entry.badgeCount} badges</span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-bold text-lg">{entry.tokens}</p>
                              <p className="text-xs text-muted-foreground">points</p>
                            </div>
                            
                            <div className="w-8">
                              {getChangeIcon(entry.change, entry.changeAmount)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No rankings available yet</p>
                      <p className="text-xs mt-1">Start ordering to climb the ranks!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Achievement Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Next Milestone
            </CardTitle>
            <CardDescription>Keep going to unlock rewards!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Top 10 Finish</p>
                    <p className="text-xs text-muted-foreground">Enter the top 10 rankings</p>
                  </div>
                </div>
                <Badge variant="outline">+50 tokens</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Weekly Champion</p>
                    <p className="text-xs text-muted-foreground">Finish #1 for a week</p>
                  </div>
                </div>
                <Badge variant="outline">+100 tokens</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}