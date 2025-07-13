"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RoleGuard from "@/components/RoleGuard";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MessageSquare, Bell, Users, TrendingUp, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  booking_id?: number;
  event_id?: number;
}

export default function FacilitatorCRM() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user: authUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/facilitator/crm/notifications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      setNotifications(response.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to load notifications");
      console.error("Notifications error:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.put(`/facilitator/crm/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      toast.success("Notification marked as read");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to mark notification as read");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Calendar className="h-5 w-5" />;
      case "payment":
        return <TrendingUp className="h-5 w-5" />;
      case "message":
        return <MessageSquare className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "booking":
        return "bg-blue-100 text-blue-800";
      case "payment":
        return "bg-green-100 text-green-800";
      case "message":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["facilitator"]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <span className="ml-4 text-lg">Loading notifications...</span>
        </div>
      </RoleGuard>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <RoleGuard allowedRoles={["facilitator"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">CRM Dashboard</h1>
            <p className="text-muted-foreground">Manage your customer relationships and notifications</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">
              {unreadCount} unread
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notifications */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </CardTitle>
                <CardDescription>
                  Stay updated with booking alerts and customer interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                    <p className="text-muted-foreground">
                      You&apos;ll see notifications here when you receive bookings or messages.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border ${
                          notification.read ? 'bg-muted/50' : 'bg-background'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium">{notification.title}</h4>
                                <Badge className={getNotificationColor(notification.type)}>
                                  {notification.type}
                                </Badge>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                                <span>{new Date(notification.created_at).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Bookings</span>
                  </div>
                  <span className="font-semibold">{notifications.filter(n => n.type === 'booking').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Payments</span>
                  </div>
                  <span className="font-semibold">{notifications.filter(n => n.type === 'payment').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Messages</span>
                  </div>
                  <span className="font-semibold">{notifications.filter(n => n.type === 'message').length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="flex items-center space-x-3">
                      <div className={`p-1 rounded ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
} 