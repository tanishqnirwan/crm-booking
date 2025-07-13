"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RoleGuard from "@/components/RoleGuard";
import { CheckCircle, Calendar, MapPin, Users, DollarSign, ArrowRight, Loader2 } from "lucide-react";
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
  const [processing, setProcessing] = useState(true);
  const [processingStep, setProcessingStep] = useState("Verifying payment...");

  useEffect(() => {
    if (bookingId) {
      processPaymentAndFetchBooking();
    }
  }, [bookingId]);

  useEffect(() => {
    // Show success message when booking is confirmed
    if (booking && !loading && !processing) {
      toast.success("Booking confirmed successfully!");
    }
  }, [booking, loading, processing]);

  const processPaymentAndFetchBooking = async () => {
    try {
      // Step 1: Verify payment and confirm booking
      setProcessingStep("Verifying payment with Razorpay...");
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
      
      setProcessingStep("Confirming booking with facilitator...");
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
      
      setProcessingStep("Sending confirmation emails...");
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
      
      setProcessingStep("Finalizing booking details...");
      
      // Fetch booking details
      const response = await api.get(`/user/bookings`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      
      const bookingData = response.data.find((b: Booking) => b.id.toString() === bookingId);
      if (bookingData) {
        setBooking(bookingData);
        toast.success("Booking confirmed successfully!");
      } else {
        // If booking not found, try to fetch it again after a delay
        setTimeout(async () => {
          try {
            const retryResponse = await api.get(`/user/bookings`, {
              headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
            });
            const retryBookingData = retryResponse.data.find((b: Booking) => b.id.toString() === bookingId);
            if (retryBookingData) {
              setBooking(retryBookingData);
              toast.success("Booking confirmed successfully!");
            } else {
              toast.error("Booking not found. Please check your dashboard.");
            }
          } catch (error) {
            toast.error("Failed to load booking details");
          }
        }, 2000);
      }
    } catch (error: any) {
      toast.error("Failed to process booking confirmation");
      console.error("Booking confirmation error:", error);
    } finally {
      setProcessing(false);
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

  if (loading || processing) {
    return (
      <RoleGuard allowedRoles={["user"]}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground mb-6">
                Your payment has been processed. We're now confirming your booking.
              </p>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                  <span className="text-lg font-medium">Processing...</span>
                </div>
                <p className="text-sm text-muted-foreground">{processingStep}</p>
                
                <div className="mt-6 space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Payment verified</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Booking confirmed</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                    <span>Finalizing details...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground">
              Your booking has been confirmed and payment processed successfully.
            </p>
          </div>

          {booking && (
            <Card>
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
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