"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export default function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user, isRehydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth state to be rehydrated before making routing decisions
    if (!isRehydrated) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      if (user.role === "facilitator") {
        router.replace("/facilitator");
      } else if (user.role === "user") {
        router.replace("/user");
      } else {
        // No role set, redirect to choose-role
        router.replace("/choose-role");
      }
    }
  }, [user, router, allowedRoles, isRehydrated]);

  // Show loading while auth state is being rehydrated
  if (!isRehydrated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback || <div>Loading...</div>;
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback || <div>Access denied...</div>;
  }

  return <>{children}</>;
} 