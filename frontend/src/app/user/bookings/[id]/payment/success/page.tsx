"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RoleGuard from "@/components/RoleGuard";
import { CheckCircle, Calendar, MapPin, Users, DollarSign, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Booking {
  id: number;
  booking_reference: string;
  status: string;
  payment_status: string;
  created_at: string;
  event: {
    id: number;
    title: string;
    start_datetime: string;
    end_datetime: string;
    price: number;
    currency: string;
    location: string;
    virtual_link: string;
  };
  facilitator: {
    id: number;
    name: string;
    email: string;
  };
}

export default function PaymentSuccess() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await api.get(`/user/bookings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      
      const bookingData = response.data.find((b: Booking) => b.id.toString() === bookingId);
      if (bookingData) {
        setBooking(bookingData);
      }
    } catch (error: any) {
      toast.error("Failed to load booking details");
      console.error("Booking details error:", error);
    } finally {
      setLoading(false);
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
      <RoleGuard allowedRoles={["user"]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <span className="ml-4 text-lg">Loading booking details...</span>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["user"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your booking has been confirmed and payment processed via Razorpay.
            </p>
          </div>

          {booking && (
            <Card>
              <CardHeader>
                <CardTitle>Booking Confirmation</CardTitle>
                <CardDescription>
                  Booking reference: {booking.booking_reference}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Event:</span>
                  <span>{booking.event.title}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Date:</span>
                  <span>{new Date(booking.event.start_datetime).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Time:</span>
                  <span>
                    {new Date(booking.event.start_datetime).toLocaleTimeString()} - {new Date(booking.event.end_datetime).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Facilitator:</span>
                  <span>{booking.facilitator.name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Price:</span>
                  <span className="font-bold">₹{booking.event.price} {booking.event.currency}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <div className="flex space-x-2">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                    <Badge className={getPaymentStatusColor(booking.payment_status)}>
                      {booking.payment_status}
                    </Badge>
                  </div>
                </div>

                {booking.event.location && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Location:</span>
                    <span>{booking.event.location}</span>
                  </div>
                )}

                {booking.event.virtual_link && (
                  <div className="pt-4 border-t">
                    <p className="font-medium mb-2">Virtual Meeting Link:</p>
                    <a 
                      href={booking.event.virtual_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all"
                    >
                      {booking.event.virtual_link}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="mt-8 space-y-4">
            <Button 
              onClick={() => router.push("/user")}
              className="w-full"
              size="lg"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>A confirmation email has been sent to your email address.</p>
              <p>You can also view your booking details in your dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
} 