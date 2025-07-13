"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import RoleGuard from "@/components/RoleGuard";

export default function PaymentCancel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');

  const getErrorMessage = () => {
    if (errorCode === 'PAYMENT_CANCELLED') {
      return "Payment was cancelled by the user.";
    } else if (errorCode === 'PAYMENT_FAILED') {
      return "Payment failed due to technical issues.";
    } else if (errorDescription) {
      return errorDescription;
    } else {
      return "Payment was not completed successfully.";
    }
  };

  return (
    <RoleGuard allowedRoles={["user"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-800">Payment Not Completed</CardTitle>
              <CardDescription className="text-red-700">
                {getErrorMessage()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-red-200">
                <h3 className="font-semibold text-lg mb-4">What Happened?</h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>• No booking was created since payment wasn't completed</p>
                  <p>• Your account was not charged</p>
                  <p>• You can try booking again at any time</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">Need Help?</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Check your internet connection</li>
                  <li>• Ensure your payment method is valid</li>
                  <li>• Contact support if the issue persists</li>
                  <li>• Try using a different payment method</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push("/user")}
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
} 