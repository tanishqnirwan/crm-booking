"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RoleGuard from "@/components/RoleGuard";
import CRMNotifications from "@/components/CRMNotifications";
import { Calendar, Users, BookOpen, Settings, Plus, TrendingUp, Clock, DollarSign, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

interface DashboardStats {
  total_events: number;
  active_events: number;
  total_bookings: number;
  total_revenue: number;
}

interface RecentBooking {
  id: number;
  booking_reference: string;
  status: string;
  payment_status: string;
  created_at: string;
  event: {
    id: number;
    title: string;
    price: number;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export default function FacilitatorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/facilitator/dashboard", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      setStats(response.data.stats);
      setRecentBookings(response.data.recent_bookings);
    } catch (error: any) {
      toast.error("Failed to load dashboard data");
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "refunded":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["facilitator"]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <span className="ml-4 text-lg">Loading dashboard...</span>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["facilitator"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="text-muted-foreground">Facilitator Dashboard</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_events || 0}</div>
              <p className="text-xs text-muted-foreground">
                Events created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_events || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_bookings || 0}</div>
              <p className="text-xs text-muted-foreground">
                Bookings received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.total_revenue || 0}</div>
              <p className="text-xs text-muted-foreground">
                Lifetime earnings
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your events and sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  onClick={() => router.push("/facilitator/events/create")} 
                  className="w-full"
                  size="lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Event
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/facilitator/events")}
                  className="w-full"
                  size="lg"
                >
                  Manage Events
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/facilitator/bookings")}
                  className="w-full"
                  size="lg"
                >
                  View Bookings
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/facilitator/transactions")}
                  className="w-full"
                  size="lg"
                >
                  View Transactions
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/facilitator/crm")}
                  className="w-full"
                  size="lg"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  CRM Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CRM Notifications */}
          <CRMNotifications />
        </div>

        {/* Recent Bookings */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>
              Latest bookings for your events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent bookings</p>
                <p className="text-sm">Bookings will appear here when users book your events</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{booking.user.name}</span>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                          <Badge className={getPaymentStatusColor(booking.payment_status)}>
                            {booking.payment_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.event.title} • ₹{booking.event.price}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/facilitator/bookings`)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
} 