"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/register", {
        name,
        email,
        password,
        role,
      });
      toast.success("Registration successful! Please login.");
      router.push("/login");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/login/google`;
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 border rounded-lg shadow bg-background">
      <h1 className="text-2xl font-bold mb-6">Register</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
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
          {loading ? "Registering..." : "Register"}
        </Button>
      </form>
      <Button variant="outline" className="w-full mt-4" onClick={handleGoogle}>
        Continue with Google
      </Button>
      <div className="mt-4 text-sm text-center">
        Already have an account? <Link href="/login" className="underline">Login</Link>
      </div>
    </div>
  );
} 