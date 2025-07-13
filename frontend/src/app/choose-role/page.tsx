"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ChooseRolePage() {
  const { user, setUser, access_token, setAccessToken } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
  }, [user, access_token, params, setUser, setAccessToken, router]);

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
      router.replace("/events");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 border rounded-lg shadow bg-background">
      <h1 className="text-2xl font-bold mb-4">Choose Your Role</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Role:</label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="role"
              value="user"
              checked={role === "user"}
              onChange={() => setRole("user")}
            />
            User
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="role"
              value="facilitator"
              checked={role === "facilitator"}
              onChange={() => setRole("facilitator")}
            />
            Facilitator
          </label>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Continue"}
        </Button>
      </form>
    </div>
  );
} 