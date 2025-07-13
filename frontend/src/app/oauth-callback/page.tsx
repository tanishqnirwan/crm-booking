"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const access_token = params.get("access_token");
    const userStr = params.get("user");
    if (access_token && userStr) {
      try {
        const user = JSON.parse(userStr);
        login(user, access_token);
        toast.success("Logged in with Google!");
        
        // Use setTimeout to ensure auth state is updated before redirect
        setTimeout(() => {
          // Redirect to appropriate dashboard based on role
          if (user.role === "facilitator") {
            router.replace("/facilitator");
          } else if (user.role === "user") {
            router.replace("/user");
          } else {
            // No role set, redirect to choose-role
            router.replace("/choose-role");
          }
        }, 100);
      } catch {
        toast.error("Failed to parse user info from Google");
        router.replace("/login");
      }
    } else {
      toast.error("Missing Google login info");
      router.replace("/login");
    }
  }, [params, login, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      <span className="ml-4 text-lg">Signing you in with Google...</span>
    </div>
  );
} 