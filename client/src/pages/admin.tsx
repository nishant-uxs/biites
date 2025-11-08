import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Users, Store, ShoppingBag, Copy, Check } from "lucide-react";
import type { University } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PlatformAnalytics {
  totalUsers: number;
  totalStudents: number;
  totalUniversities: number;
  totalOutlets: number;
  totalOrders: number;
  totalRevenue: number;
}

interface UniversityStats {
  outletCount: number;
  studentCount: number;
  orderCount: number;
}

function UniversityCard({ university }: { university: University }) {
  const { data: stats, isLoading, isError } = useQuery<UniversityStats>({
    queryKey: ['/api/admin/universities', university.id, 'stats'],
    retry: 2,
  });

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border"
      data-testid={`university-card-${university.id}`}
    >
      <div>
        <h3 className="font-semibold text-lg" data-testid={`text-university-name-${university.id}`}>
          {university.name}
        </h3>
        <p className="text-sm text-muted-foreground">{university.location}</p>
        <p className="text-xs text-muted-foreground mt-1">Code: {university.code}</p>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1">
          <Store className="w-4 h-4 text-primary" />
          <span className="font-medium" data-testid={`text-outlets-${university.id}`}>
            {isError ? "Error" : isLoading ? "..." : `${stats?.outletCount || 0} outlets`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-primary" />
          <span className="font-medium" data-testid={`text-students-${university.id}`}>
            {isError ? "Error" : isLoading ? "..." : `${stats?.studentCount || 0} students`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ShoppingBag className="w-4 h-4 text-primary" />
          <span className="font-medium" data-testid={`text-orders-${university.id}`}>
            {isError ? "Error" : isLoading ? "..." : `${stats?.orderCount || 0} orders`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    code: "",
  });
  
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Redirect if not app admin
  if (user && user.role !== "app_admin") {
    setLocation("/");
    return null;
  }

  const { data: universities = [] } = useQuery<University[]>({
    queryKey: ['/api/universities'],
  });

  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError } = useQuery<PlatformAnalytics>({
    queryKey: ['/api/admin/analytics'],
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const createUniversityMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/admin/universities", data);
      return await response.json();
    },
    onSuccess: (response: any) => {
      setGeneratedCredentials(response.credentials);
      setShowCredentials(true);
      queryClient.invalidateQueries({ queryKey: ['/api/universities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
      setFormData({ name: "", location: "", code: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.code) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }
    createUniversityMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen pb-20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage universities across Campus Biites</p>
          </div>
        </div>

        {/* Platform Analytics */}
        {analyticsLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading analytics...</p>
          </div>
        )}
        
        {analyticsError && (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-destructive">Failed to load analytics. Please try again later.</p>
            </CardContent>
          </Card>
        )}
        
        {analytics && !analyticsLoading && !analyticsError && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-users">{analytics.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-students">{analytics.totalStudents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Universities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-universities">{analytics.totalUniversities}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Outlets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-outlets">{analytics.totalOutlets}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-orders">{analytics.totalOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-revenue">
                  ₹{parseFloat(analytics.totalRevenue as any).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add University Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add New University
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">University Name</Label>
                  <Input
                    id="name"
                    data-testid="input-university-name"
                    placeholder="e.g., IIT Delhi"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">University Code</Label>
                  <Input
                    id="code"
                    data-testid="input-university-code"
                    placeholder="e.g., IIT-DEL"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  data-testid="input-university-location"
                  placeholder="e.g., Hauz Khas, New Delhi"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={createUniversityMutation.isPending}
                data-testid="button-create-university"
              >
                {createUniversityMutation.isPending ? "Creating..." : "Create University"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Universities List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              All Universities ({universities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {universities.map((university) => (
                <UniversityCard key={university.id} university={university} />
              ))}
              {universities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No universities added yet</p>
                  <p className="text-xs mt-1">Add your first university using the form above</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credentials Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>University Admin Credentials</DialogTitle>
            <DialogDescription>
              Save these credentials securely. The password will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={generatedCredentials?.email || ""}
                  data-testid="text-generated-email"
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedCredentials?.email || "", "email")}
                  data-testid="button-copy-email"
                >
                  {copiedField === "email" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={generatedCredentials?.password || ""}
                  data-testid="text-generated-password"
                  className="flex-1 font-mono"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedCredentials?.password || "", "password")}
                  data-testid="button-copy-password"
                >
                  {copiedField === "password" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                These credentials are for the university admin to log in and manage outlets.
                Make sure to save them before closing this dialog.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowCredentials(false)} data-testid="button-close-credentials">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
