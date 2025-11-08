import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Users, Store } from "lucide-react";
import type { University } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    code: "",
  });

  // Redirect if not app admin
  if (user && user.role !== "app_admin") {
    setLocation("/");
    return null;
  }

  const { data: universities = [] } = useQuery<University[]>({
    queryKey: ['/api/universities'],
  });

  const createUniversityMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/universities", data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "University created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/universities'] });
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage universities across Campus Biites</p>
          </div>
        </div>

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
                <div
                  key={university.id}
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
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Store className="w-4 h-4 text-primary" />
                      <span className="font-medium" data-testid={`text-outlets-${university.id}`}>0 outlets</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-medium" data-testid={`text-students-${university.id}`}>0 students</span>
                    </div>
                  </div>
                </div>
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
    </div>
  );
}
