import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Utensils, TrendingUp, Users, Trophy, Zap, Star } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center space-y-6 py-12">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <Utensils className="w-12 h-12" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Campus <span className="text-primary">Biites</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Smart food ordering for campus life. Budget-aware, personalized, and rewarding.
          </p>
          <div className="pt-6">
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login"
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <Card className="border-2 hover-elevate">
            <CardContent className="pt-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Budget Smart</h3>
              <p className="text-sm text-muted-foreground">
                Filter by budget and get recommendations within your spending limit.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover-elevate">
            <CardContent className="pt-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Group Orders</h3>
              <p className="text-sm text-muted-foreground">
                Create shared orders with friends and split bills automatically.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover-elevate">
            <CardContent className="pt-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Earn Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Get tokens for ratings and spin the wheel for prizes!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Features */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Smart Queue Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    See real-time ETAs and avoid busy hours with our smart queue predictor.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-4">
                <Star className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Personalized Experience</h4>
                  <p className="text-sm text-muted-foreground">
                    Comfort food section with your favorites and meal pairing suggestions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Footer */}
        <div className="mt-16 text-center pb-12">
          <p className="text-muted-foreground mb-4">
            Join hundreds of students ordering smarter
          </p>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login-footer"
          >
            Sign In to Order
          </Button>
        </div>
      </div>
    </div>
  );
}
