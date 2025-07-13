"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, MapPin, Users, DollarSign } from "lucide-react";
import RoleGuard from "@/components/RoleGuard";

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get booking details from URL params or localStorage
    const bookingRef = searchParams.get('booking_reference');
    const paymentId = searchParams.get('payment_id');
    
    if (bookingRef && paymentId) {
      // Store in localStorage for the booking confirmation
      localStorage.setItem('pending_booking', JSON.stringify({
        booking_reference: bookingRef,
        payment_id: paymentId
      }));
    }
    
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <RoleGuard allowedRoles={["user"]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <span className="ml-4 text-lg">Processing payment...</span>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["user"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">Payment Successful!</CardTitle>
              <CardDescription className="text-green-700">
                Your booking has been confirmed and payment processed successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-green-200">
                <h3 className="font-semibold text-lg mb-4">Booking Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking Reference:</span>
                    <span className="font-medium">{searchParams.get('booking_reference')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment ID:</span>
                    <span className="font-medium">{searchParams.get('payment_id')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">What's Next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• You'll receive a confirmation email shortly</li>
                  <li>• Event details will be available in your dashboard</li>
                  <li>• Any virtual meeting links will be shared before the event</li>
                  <li>• Contact the facilitator if you have any questions</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => router.push("/user")}
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push("/user/bookings")}
                  className="flex-1"
                >
                  View My Bookings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
} 