"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RoleGuard from "@/components/RoleGuard";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Calendar, MapPin, Users, DollarSign, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Booking {
  id: number;
  booking_reference: string;
  status: string;
  payment_status: string;
  created_at: string;
  notes: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  event: {
    id: number;
    title: string;
    start_datetime: string;
    end_datetime: string;
    price: number;
    currency: string;
    location: string;
  };
}

export default function FacilitatorBookings() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user: authUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get("/facilitator/bookings", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      setBookings(response.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to load bookings");
      console.error("Bookings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: number, status: string) => {
    try {
      await api.put(`/facilitator/bookings/${bookingId}/status`, {
        status: status
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      
      toast.success(`Booking ${status}`);
      fetchBookings(); // Refresh the list
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || "Failed to update booking status");
      console.error("Update booking error:", error);
    }
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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["facilitator"]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <span className="ml-4 text-lg">Loading bookings...</span>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["facilitator"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Bookings</h1>
            <p className="text-muted-foreground">Manage your event bookings</p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
              <p className="text-muted-foreground text-center">
                When users book your events, they&apos;ll appear here for you to manage.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{booking.event.title}</h3>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <Badge className={getPaymentStatusColor(booking.payment_status)}>
                          {booking.payment_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Booking #{booking.booking_reference}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">₹{booking.event.price}</p>
                      <p className="text-sm text-muted-foreground">{booking.event.currency}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{booking.user.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(booking.event.start_datetime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(booking.event.start_datetime).toLocaleTimeString()} - {new Date(booking.event.end_datetime).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{booking.event.location || "Virtual event"}</span>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Notes from user:</p>
                      <p className="text-sm text-muted-foreground">{booking.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Booked on {new Date(booking.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {booking.status === "pending" && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking.id, "confirmed")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateBookingStatus(booking.id, "cancelled")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
} 