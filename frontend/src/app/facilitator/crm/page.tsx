"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoleGuard from "@/components/RoleGuard";
import CRMNotifications from "@/components/CRMNotifications";
import { Bell, Users, TrendingUp, MessageSquare, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Customer {
  id: number;
  name: string;
  email: string;
  total_bookings: number;
  total_spent: number;
  last_booking: string;
}

interface CRMStats {
  total_customers: number;
  total_notifications: number;
  total_revenue: number;
  average_booking_value: number;
}

export default function CRMPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCRMData();
  }, []);

  const fetchCRMData = async () => {
    try {
      // Fetch CRM stats and customer data
      const [statsResponse, customersResponse] = await Promise.all([
        api.get("/facilitator/crm/stats"),
        api.get("/facilitator/crm/customers")
      ]);
      
      setStats(statsResponse.data);
      setCustomers(customersResponse.data);
    } catch (error: any) {
      toast.error("Failed to load CRM data");
      console.error("CRM error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["facilitator"]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <span className="ml-4 text-lg">Loading CRM...</span>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["facilitator"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Customer Relationship Management</h1>
            <p className="text-muted-foreground">Manage your customers and notifications</p>
          </div>
          <Button onClick={() => router.push("/facilitator")} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        {/* CRM Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_customers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Unique customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_notifications || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total notifications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.total_revenue || 0}</div>
              <p className="text-xs text-muted-foreground">
                Lifetime revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.average_booking_value || 0}</div>
              <p className="text-xs text-muted-foreground">
                Per booking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CRM Tabs */}
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6">
            <CRMNotifications />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Database</CardTitle>
                <CardDescription>
                  View and manage your customer relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No customers yet</p>
                    <p className="text-sm">Customers will appear here when they book your events</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{customer.name}</h3>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{customer.total_bookings} bookings</span>
                              <span>₹{customer.total_spent} spent</span>
                              <span>Last: {new Date(customer.last_booking).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {customer.total_bookings} bookings
                          </Badge>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
} 