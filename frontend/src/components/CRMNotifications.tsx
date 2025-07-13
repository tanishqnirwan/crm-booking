"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, XCircle, Clock, User, Calendar } from "lucide-react";
import { toast } from "sonner";

interface CRMNotification {
  id: number;
  booking_id: number;
  action: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  event: {
    id: number;
    title: string;
  };
  facilitator: {
    id: number;
    name: string;
    email: string;
  };
  status: string;
  payment_status: string;
  timestamp?: string;
}

export default function CRMNotifications() {
  const [notifications, setNotifications] = useState<CRMNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [crmAvailable, setCrmAvailable] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // Fetch notifications from CRM service
      const response = await fetch('http://localhost:5001/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setCrmAvailable(true);
      } else {
        console.error('CRM service returned error:', response.status);
        setCrmAvailable(false);
        toast.error('Failed to load notifications - CRM service unavailable');
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setCrmAvailable(false);
      toast.error('CRM service not available. Please ensure the CRM service is running.');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'payment_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'payment_completed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'payment_completed':
        return 'Payment Completed';
      case 'approved':
        return 'Booking Approved';
      case 'rejected':
        return 'Booking Rejected';
      default:
        return action;
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`http://localhost:5001/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast.success('Notification deleted');
        fetchNotifications();
      } else {
        toast.error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification - CRM service unavailable');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            CRM Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-2">Loading notifications...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          CRM Notifications
          <Badge variant="secondary">{notifications.length}</Badge>
        </CardTitle>
        <CardDescription>
          Real-time notifications from your booking system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            {crmAvailable ? (
              <>
                <p>No notifications yet</p>
                <p className="text-sm">Notifications will appear here when bookings are made</p>
              </>
            ) : (
              <>
                <p>CRM Service Unavailable</p>
                <p className="text-sm">Please ensure the CRM service is running on port 5001</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchNotifications}
                  className="mt-4"
                >
                  Retry Connection
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <div
                key={notification.id || index}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getActionIcon(notification.action)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getActionColor(notification.action)}>
                          {getActionText(notification.action)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Booking #{notification.booking_id}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            <strong>{notification.user?.name || 'Unknown User'}</strong> ({notification.user?.email || 'No email'})
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Event: <strong>{notification.event?.title || 'Unknown Event'}</strong>
                          </span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Status: {notification.status || 'Unknown'} | Payment: {notification.payment_status || 'Unknown'}
                          {notification.timestamp && (
                            <div className="mt-1">
                              {formatTimestamp(notification.timestamp)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Mark as read or take action
                        toast.success('Notification marked as read');
                      }}
                    >
                      Mark Read
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-700"
                      disabled={!notification.id}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            className="w-full"
          >
            Refresh Notifications
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 