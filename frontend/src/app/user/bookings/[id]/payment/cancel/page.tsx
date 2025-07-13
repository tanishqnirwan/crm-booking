"use client";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RoleGuard from "@/components/RoleGuard";
import { XCircle, ArrowRight, RefreshCw } from "lucide-react";

export default function PaymentCancel() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const handleRetryPayment = () => {
    // Navigate back to the booking page to retry payment
    router.push(`/user/events/${bookingId}/book`);
  };

  const handleBackToDashboard = () => {
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
                Your booking is still pending and needs payment to be confirmed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  • Your booking was created but payment was not completed
                </p>
                <p className="text-sm text-muted-foreground">
                  • No charges have been made to your Razorpay account
                </p>
                <p className="text-sm text-muted-foreground">
                  • You can retry the payment at any time
                </p>
                <p className="text-sm text-muted-foreground">
                  • Your booking will be held for 24 hours
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 space-y-4">
            <Button 
              onClick={handleRetryPayment}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Payment
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleBackToDashboard}
              className="w-full"
              size="lg"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
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