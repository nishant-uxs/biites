import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Settings } from "lucide-react";

export default function OutletDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Outlet Dashboard</h1>
              <p className="text-muted-foreground">Manage your outlet menu and orders</p>
            </div>
          </div>
          <Button variant="outline" data-testid="button-settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Today's Orders</CardTitle>
              <CardDescription>Active orders in queue</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-foreground">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>Total dishes available</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-foreground">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outlet Status</CardTitle>
              <CardDescription>Current operating mode</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-green-600">Active</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>Outlet management features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground">This dashboard will include:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Menu item management (add, edit, delete dishes)</li>
              <li>Order queue with real-time updates</li>
              <li>Chill period toggle</li>
              <li>Outlet analytics and insights</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
