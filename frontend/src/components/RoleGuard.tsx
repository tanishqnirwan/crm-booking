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
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
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
  }, [user, router, allowedRoles]);

  if (!user) {
    return fallback || <div>Loading...</div>;
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback || <div>Access denied...</div>;
  }

  return <>{children}</>;
} 