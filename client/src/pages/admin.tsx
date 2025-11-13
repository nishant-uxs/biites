import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, Plus, Users, Store, ShoppingBag, Copy, Check, Shield, 
  TrendingUp, IndianRupee, MapPin, Code, Activity, UserCheck, BookOpen,
  AlertCircle, GraduationCap, ChefHat, Zap, Trash2, UserX, LogOut
} from "lucide-react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  universityId: string | null;
  tokens: number;
  createdAt: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = 0;
    const end = isNaN(value) ? 0 : value;
    const duration = 600;
    let frame = 0 as unknown as number;
    const startTime = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - startTime) / duration);
      const current = Math.round(start + (end - start) * p);
      setDisplay(current);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

const universitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  code: z.string().min(1, "Code is required").regex(/^[A-Z0-9-]+$/, "Code must be uppercase letters, numbers, and hyphens only"),
});

type UniversityFormValues = z.infer<typeof universitySchema>;

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddUniversity, setShowAddUniversity] = useState(false);
  
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [resetPasswordUniversityId, setResetPasswordUniversityId] = useState<string | null>(null);

  const form = useForm<UniversityFormValues>({
    resolver: zodResolver(universitySchema),
    defaultValues: {
      name: "",
      location: "",
      code: "",
    },
  });

  // Redirect if not app admin
  if (user && user.role !== "app_admin") {
    setLocation("/");
    return null;
  }

  const { data: universities = [], isLoading: universitiesLoading } = useQuery<University[]>({
    queryKey: ['/api/universities'],
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<PlatformAnalytics>({
    queryKey: ['/api/admin/analytics'],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${field === 'email' ? 'Email' : 'Password'} copied to clipboard`,
    });
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const createUniversityMutation = useMutation({
    mutationFn: async (data: UniversityFormValues) => {
      const response = await apiRequest("POST", "/api/admin/universities", data);
      return await response.json();
    },
    onSuccess: (response: any) => {
      setGeneratedCredentials(response.credentials);
      setShowCredentials(true);
      queryClient.invalidateQueries({ queryKey: ['/api/universities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
      setShowAddUniversity(false);
      form.reset();
      toast({
        title: "Success",
        description: "University created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: UniversityFormValues) => {
    createUniversityMutation.mutate(values);
  };

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (universityId: string) => {
      const response = await apiRequest("PATCH", `/api/admin/universities/${universityId}/admin/reset-password`);
      return await response.json();
    },
    onSuccess: (response: any) => {
      setGeneratedCredentials(response);
      setShowCredentials(true);
      setResetPasswordUniversityId(null);
      toast({
        title: "Password Reset",
        description: "New password generated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUniversityMutation = useMutation({
    mutationFn: async (universityId: string) => {
      await apiRequest("DELETE", `/api/admin/universities/${universityId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/universities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
      toast({
        title: "Success",
        description: "University deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Stats cards data
  const statsCards = [
    {
      title: "Total Universities",
      value: analytics?.totalUniversities || 0,
      icon: GraduationCap,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      description: "Active campuses",
    },
    {
      title: "Total Outlets",
      value: analytics?.totalOutlets || 0,
      icon: Store,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/20",
      description: "Food outlets",
    },
    {
      title: "Total Students",
      value: analytics?.totalStudents || 0,
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      description: "Registered users",
    },
    {
      title: "Total Orders",
      value: analytics?.totalOrders || 0,
      icon: ShoppingBag,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      description: "All time orders",
    },
    {
      title: "Total Revenue",
      value: analytics?.totalRevenue || 0,
      icon: IndianRupee,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      description: "Platform revenue",
    },
    {
      title: "Active Users",
      value: analytics?.totalUsers || 0,
      icon: UserCheck,
      color: "text-pink-500",
      bg: "bg-pink-50 dark:bg-pink-900/20",
      description: "All user accounts",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-20 items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Platform Admin</h1>
              <p className="text-sm text-muted-foreground">Manage universities and monitor platform metrics</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="default" className="gap-1">
              <Activity className="w-3 h-3" />
              System Active
            </Badge>
            <Button variant="outline" size="sm" onClick={logout} data-testid="button-logout-admin">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex flex-wrap gap-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="universities">Universities</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analyticsLoading ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Loading analytics...
                </div>
              ) : (
                statsCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index} className="hover-elevate">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {stat.title}
                        </CardTitle>
                        <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {stat.title === 'Total Revenue' ? (
                            <>
                              ₹<AnimatedNumber value={Number(stat.value) || 0} />
                            </>
                          ) : (
                            <AnimatedNumber value={Number(stat.value) || 0} />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

          </TabsContent>

          {/* Universities Tab */}
          <TabsContent value="universities" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Manage Universities</CardTitle>
                  <CardDescription>Add and manage campus partnerships</CardDescription>
                </div>
                <Dialog open={showAddUniversity} onOpenChange={setShowAddUniversity}>
                  <Button onClick={() => setShowAddUniversity(true)} data-testid="button-add-university">
                    <Plus className="w-4 h-4 mr-2" />
                    Add University
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New University</DialogTitle>
                      <DialogDescription>
                        Create a new university partnership. Login credentials will be generated automatically.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>University Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="IIT Delhi" data-testid="input-university-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="New Delhi" data-testid="input-university-location" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>University Code</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="IIT-DEL" 
                                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                  data-testid="input-university-code" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowAddUniversity(false);
                              form.reset();
                            }}
                            data-testid="button-cancel"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={createUniversityMutation.isPending}
                            data-testid="button-submit"
                          >
                            Create University
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {universitiesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading universities...
                  </div>
                ) : universities.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No universities added yet</p>
                    <Button variant="outline" onClick={() => setShowAddUniversity(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add your first university
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {universities.map((university) => (
                      <UniversityCard 
                        key={university.id} 
                        university={university}
                        onResetPassword={() => resetPasswordMutation.mutate(university.id)}
                        onDelete={() => {
                          if (confirm(`Delete ${university.name}? This will remove all outlets, dishes, and orders. This action cannot be undone.`)) {
                            deleteUniversityMutation.mutate(university.id);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all platform users</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading users...
                  </div>
                ) : allUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-3 text-left text-sm font-medium">Email</th>
                            <th className="p-3 text-left text-sm font-medium">Name</th>
                            <th className="p-3 text-left text-sm font-medium">Role</th>
                            <th className="p-3 text-left text-sm font-medium">Created</th>
                            <th className="p-3 text-right text-sm font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allUsers.map((adminUser) => (
                            <tr key={adminUser.id} className="border-b hover-elevate" data-testid={`row-user-${adminUser.id}`}>
                              <td className="p-3 text-sm font-mono" data-testid={`text-email-${adminUser.id}`}>{adminUser.email}</td>
                              <td className="p-3 text-sm">
                                {adminUser.firstName || adminUser.lastName 
                                  ? `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim()
                                  : '-'}
                              </td>
                              <td className="p-3">
                                <Badge variant={
                                  adminUser.role === 'app_admin' ? 'default' : 
                                  adminUser.role === 'university_admin' ? 'secondary' : 
                                  adminUser.role === 'outlet_owner' ? 'outline' : 
                                  'default'
                                } data-testid={`badge-role-${adminUser.id}`}>
                                  {adminUser.role.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">
                                {new Date(adminUser.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-right">
                                {adminUser.id !== user?.id && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete ${adminUser.email}? This action cannot be undone.`)) {
                                        deleteUserMutation.mutate(adminUser.id);
                                      }
                                    }}
                                    disabled={deleteUserMutation.isPending}
                                    data-testid={`button-delete-user-${adminUser.id}`}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
                Share these credentials with the university administrator. They will need them to log in and manage their campus outlets.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowCredentials(false)} data-testid="button-close">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UniversityCard({ 
  university, 
  onResetPassword,
  onDelete 
}: { 
  university: University;
  onResetPassword: () => void;
  onDelete: () => void;
}) {
  const { data: stats, isLoading } = useQuery<UniversityStats>({
    queryKey: ['/api/admin/universities', university.id, 'stats'],
    retry: 2,
  });

  const { data: adminData } = useQuery<{ email: string }>({
    queryKey: ['/api/admin/universities', university.id, 'admin'],
  });

  const [showSales, setShowSales] = useState(false);
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");

  const { data: sales = [], isLoading: salesLoading, refetch: refetchSales } = useQuery<Array<{ outletId: string; outletName: string; totalOrders: number; totalRevenue: number }>>({
    queryKey: ['/api/admin/universities', university.id, 'sales', start, end],
    enabled: showSales,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const resp = await fetch(`/api/admin/universities/${university.id}/sales?${params.toString()}`);
      if (!resp.ok) throw new Error('Failed to fetch sales');
      return await resp.json();
    }
  });

  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg" data-testid={`text-university-name-${university.id}`}>
                {university.name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {university.location}
                </div>
                <div className="flex items-center gap-1">
                  <Code className="w-3 h-3" />
                  {university.code}
                </div>
                {adminData && (
                  <div className="flex items-center gap-1 text-xs font-mono">
                    {adminData.email}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold" data-testid={`text-outlets-${university.id}`}>
                {isLoading ? "..." : stats?.outletCount || 0}
              </p>
              <p className="text-xs text-muted-foreground">Outlets</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" data-testid={`text-students-${university.id}`}>
                {isLoading ? "..." : stats?.studentCount || 0}
              </p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" data-testid={`text-orders-${university.id}`}>
                {isLoading ? "..." : stats?.orderCount || 0}
              </p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowSales(true)}
                title="View Sales"
                data-testid={`button-view-sales-${university.id}`}
              >
                <TrendingUp className="w-4 h-4 mr-1" /> Sales
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onResetPassword}
                title="Reset Admin Password"
                data-testid={`button-reset-password-${university.id}`}
              >
                <Shield className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={onDelete}
                title="Delete University"
                data-testid={`button-delete-university-${university.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <Dialog open={showSales} onOpenChange={setShowSales}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sales - {university.name}</DialogTitle>
              <DialogDescription>
                View total orders and revenue per outlet. Use optional date filters.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label>Date From</Label>
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label>Date To</Label>
                <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
              <Button onClick={() => refetchSales()} disabled={salesLoading}>Apply</Button>
            </div>
            <div className="mt-4 rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Outlet</th>
                    <th className="p-3 text-left text-sm font-medium">Orders</th>
                    <th className="p-3 text-left text-sm font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesLoading ? (
                    <tr><td className="p-3 text-sm text-muted-foreground" colSpan={3}>Loading...</td></tr>
                  ) : sales.length === 0 ? (
                    <tr><td className="p-3 text-sm text-muted-foreground" colSpan={3}>No data</td></tr>
                  ) : (
                    sales.map((row) => (
                      <tr key={row.outletId} className="border-b">
                        <td className="p-3 text-sm">{row.outletName}</td>
                        <td className="p-3 text-sm">{row.totalOrders}</td>
                        <td className="p-3 text-sm">₹{row.totalRevenue}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}