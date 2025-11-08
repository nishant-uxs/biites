import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Award, TrendingUp, Medal, Crown, Map, Star, Coins, Users, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Badge as BadgeType, UserBadge } from "@shared/schema";

const badgeIcons: Record<string, React.ComponentType<any>> = {
  trophy: Trophy,
  map: Map,
  star: Star,
  coins: Coins,
  users: Users,
};

type LeaderboardEntry = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  tokens: number;
  orderCount: number;
  rank: number;
};

export default function Profile() {
  const { user } = useAuth();

  const { data: userBadges = [] } = useQuery<(UserBadge & { badge: BadgeType })[]>({
    queryKey: ['/api/badges/user'],
  });

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard'],
  });

  const userRank = leaderboard.findIndex(entry => entry.userId === user?.id) + 1;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="font-bold text-lg">{rank}</span>;
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-card-border">
        <div className="container mx-auto px-4 py-4 max-w-3xl flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        {/* User Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{user?.tokens || 0} tokens</span>
                  </div>
                  {userRank > 0 && (
                    <Badge variant="secondary">
                      Rank #{userRank}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Achievement Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userBadges.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {userBadges.map(({ badge, earnedAt }) => {
                  if (!badge) return null;
                  const IconComponent = badgeIcons[badge.icon] || Trophy;
                  return (
                    <div key={badge.id} className="text-center space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {earnedAt ? new Date(earnedAt).toLocaleDateString() : "Recently"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No badges earned yet</p>
                <p className="text-xs mt-1">Complete challenges to earn badges!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Campus Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((entry) => {
                  const isCurrentUser = entry.userId === user?.id;
                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        isCurrentUser ? 'bg-primary/10 border border-primary' : 'bg-muted/30'
                      }`}
                      data-testid={`leaderboard-${entry.rank}`}
                    >
                      <div className="w-8 flex items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={entry.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {entry.firstName?.[0]}{entry.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">
                          {entry.firstName} {entry.lastName}
                          {isCurrentUser && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.orderCount} orders
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{entry.tokens}</p>
                        <p className="text-xs text-muted-foreground">tokens</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Leaderboard coming soon!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
