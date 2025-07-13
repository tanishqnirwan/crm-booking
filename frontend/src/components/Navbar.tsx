"use client";
import Link from 'next/link';
import { useAuth } from '@/lib/auth-store';
import { hasRole } from '@/lib/rbac';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b bg-background">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-bold text-lg">Booking System</Link>
        <Link href="/events" className="text-sm">Events</Link>
        {user && hasRole(user.role, ['user']) && (
          <Link href="/bookings" className="text-sm">My Bookings</Link>
        )}
        {user && hasRole(user.role, ['facilitator']) && (
          <Link href="/facilitator/events" className="text-sm">My Events</Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm">{user.name} ({user.role})</span>
            <Link href="/profile" className="text-sm">Profile</Link>
            <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm">Login</Link>
            <Link href="/register" className="text-sm">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
} 