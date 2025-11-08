import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, MapPin } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface University {
  id: string;
  name: string;
  location: string;
  code: string;
}

export default function SelectUniversity() {
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);
  const { refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: universities, isLoading } = useQuery<University[]>({
    queryKey: ["/api/universities"],
  });

  const selectUniversityMutation = useMutation({
    mutationFn: async (universityId: string) => {
      return apiRequest("POST", "/api/auth/select-university", { universityId });
    },
    onSuccess: async () => {
      // Refresh user state immediately to update auth context
      await refreshUser();
      toast({
        title: "University Selected",
        description: "Your campus has been set successfully!",
      });
      // RoleBasedRedirect will handle navigation once user state is refreshed
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Selection Failed",
        description: error.message || "Failed to select university",
        variant: "destructive",
      });
    },
  });

  const handleSelect = () => {
    if (selectedUniversityId) {
      selectUniversityMutation.mutate(selectedUniversityId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" data-testid="loading-universities">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-primary" />
          <CardTitle className="text-3xl">Select Your Campus</CardTitle>
          <CardDescription>
            Choose your university to get started. This cannot be changed later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {universities?.map((university) => (
              <Card
                key={university.id}
                className={`cursor-pointer transition-all hover-elevate ${
                  selectedUniversityId === university.id
                    ? "ring-2 ring-primary bg-accent"
                    : ""
                }`}
                onClick={() => setSelectedUniversityId(university.id)}
                data-testid={`card-university-${university.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{university.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{university.location}</span>
                      </div>
                    </div>
                    <div className="text-xs font-mono bg-muted px-3 py-1 rounded-md">
                      {university.code}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            onClick={handleSelect}
            disabled={!selectedUniversityId || selectUniversityMutation.isPending}
            className="w-full"
            data-testid="button-confirm-university"
          >
            {selectUniversityMutation.isPending ? "Confirming..." : "Confirm Selection"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
