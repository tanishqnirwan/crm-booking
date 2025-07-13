"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { user, access_token, isRehydrated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we're in the browser and auth state is being rehydrated
    if (typeof window !== "undefined") {
      // Wait for Zustand persistence to rehydrate
      if (isRehydrated) {
        setIsLoading(false);
      } else {
        // Fallback timeout in case rehydration takes too long
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
      }
    } else {
      setIsLoading(false);
    }
  }, [isRehydrated]);

  // Show loading spinner while auth state is being rehydrated
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 