"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RoleGuard from "@/components/RoleGuard";
import { XCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function PaymentCancel() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  useEffect(() => {
    // Show cancellation message
    toast.error("Payment was cancelled");
  }, []);

  const handleRetryPayment = () => {
    // Navigate back to the booking page
    router.push(`/user/events/${bookingId}/book`);
  };

  const handleGoToDashboard = () => {
    router.push("/user");
  };

  return (
    <RoleGuard allowedRoles={["user"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Payment Cancelled</h1>
            <p className="text-muted-foreground">
              Your payment was cancelled. No charges have been made to your account.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>What happened?</CardTitle>
              <CardDescription>
                Your payment was cancelled before completion. This could be due to:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium">Payment Cancelled</p>
                  <p className="text-sm text-muted-foreground">
                    You cancelled the payment process or closed the payment window.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium">No Charges Made</p>
                  <p className="text-sm text-muted-foreground">
                    No money has been deducted from your account. Your booking is not confirmed.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Try Again</p>
                  <p className="text-sm text-muted-foreground">
                    You can retry the payment to complete your booking.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 space-y-4">
            <Button 
              onClick={handleRetryPayment}
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retry Payment
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleGoToDashboard}
              className="w-full"
            >
              Back to Dashboard
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Need help? Contact our support team.</p>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
} 