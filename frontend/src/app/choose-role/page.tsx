"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Calendar, CheckCircle } from "lucide-react";

export default function ChooseRolePage() {
  const { user, setUser, access_token, setAccessToken, isRehydrated } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isRehydrated) return;
    
    if (!user || !access_token) {
      // Try to get from URL params (for first load after OAuth)
      const userStr = params.get("user");
      const token = params.get("access_token");
      if (userStr && token) {
        try {
          setUser(JSON.parse(userStr));
          setAccessToken(token);
        } catch {}
      } else {
        router.replace("/login");
      }
    }
  }, [user, access_token, params, setUser, setAccessToken, router, isRehydrated]);

  // Show loading while auth state is being rehydrated
  if (!isRehydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(
        "/choose-role",
        { role },
        { headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" } }
      );
      setUser({ ...user!, ...res.data });
      toast.success("Profile updated!");
      
      // Use setTimeout to ensure auth state is updated before redirect
      setTimeout(() => {
        // Redirect to appropriate dashboard based on role
        if (role === "facilitator") {
          router.replace("/facilitator");
        } else {
          router.replace("/user");
        }
      }, 100);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      value: "user",
      title: "User",
      description: "Book sessions and events",
      icon: Users,
      features: [
        "Browse available events",
        "Book sessions with facilitators",
        "Track your bookings",
        "Manage your profile"
      ],
      color: "bg-blue-500/10 text-blue-600 border-blue-200"
    },
    {
      value: "facilitator",
      title: "Facilitator",
      description: "Host sessions and events",
      icon: Calendar,
      features: [
        "Create and manage events",
        "Host sessions and workshops",
        "Track bookings and revenue",
        "Build your facilitator profile"
      ],
      color: "bg-green-500/10 text-green-600 border-green-200"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-4xl">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Choose Your Role</CardTitle>
            <CardDescription className="text-lg">
              Select how you'd like to use our platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <form onSubmit={handleSubmit}>
              <RadioGroup value={role} onValueChange={setRole} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roleOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <div key={option.value}>
                      <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                      <Label
                        htmlFor={option.value}
                        className={`flex flex-col h-full rounded-xl border-2 border-muted bg-popover p-6 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all duration-200 hover:shadow-lg`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${option.color}`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{option.title}</h3>
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                            </div>
                          </div>
                          {role === option.value && (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">What you can do:</h4>
                          <ul className="space-y-1">
                            {option.features.map((feature, index) => (
                              <li key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Badge 
                          variant="secondary" 
                          className="mt-4 w-fit"
                        >
                          {option.value === "user" ? "Most Popular" : "For Professionals"}
                        </Badge>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>

              <div className="mt-8 flex justify-center">
                <Button type="submit" size="lg" disabled={loading} className="px-8">
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Setting up your account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Continue to Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </div>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              <p>You can change your role later in your account settings</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 