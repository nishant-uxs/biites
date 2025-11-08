import { useState } from "react";
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
  AlertCircle, GraduationCap, ChefHat, Zap, ChevronDown, ChevronUp
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

const universitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  code: z.string().min(1, "Code is required").regex(/^[A-Z0-9-]+$/, "Code must be uppercase letters, numbers, and hyphens only"),
});

type UniversityFormValues = z.infer<typeof universitySchema>;

export default function AdminDashboard() {
  const { user } = useAuth();
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
      value: `₹${analytics?.totalRevenue || 0}`,
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
          <div className="ml-auto">
            <Badge variant="default" className="gap-1">
              <Activity className="w-3 h-3" />
              System Active
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="universities">Universities</TabsTrigger>
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
                        <div className="text-2xl font-bold">{stat.value}</div>
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
                      <UniversityCard key={university.id} university={university} />
                    ))}
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

function UniversityCard({ university }: { university: University }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: stats, isLoading } = useQuery<UniversityStats>({
    queryKey: ['/api/admin/universities', university.id, 'stats'],
    retry: 2,
  });

  const { data: outlets = [], isLoading: outletsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/universities', university.id, 'outlets'],
    enabled: isExpanded,
    retry: 2,
  });

  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div 
          className="flex items-center justify-between cursor-pointer" 
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid={`button-toggle-university-${university.id}`}
        >
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
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              data-testid={`button-expand-${university.id}`}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded Outlets View */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Store className="w-4 h-4 text-primary" />
              <h4 className="font-semibold">Outlets</h4>
            </div>
            {outletsLoading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Loading outlets...
              </div>
            ) : outlets.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No outlets added yet
              </div>
            ) : (
              <div className="space-y-2">
                {outlets.map((outlet: any) => (
                  <div 
                    key={outlet.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    data-testid={`outlet-${outlet.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                        <ChefHat className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium">{outlet.name}</p>
                        <p className="text-xs text-muted-foreground">{outlet.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{outlet.dishCount || 0}</p>
                        <p className="text-xs text-muted-foreground">Dishes</p>
                      </div>
                      <Badge variant={outlet.isOpen ? "default" : "secondary"}>
                        {outlet.isOpen ? "Open" : "Closed"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}