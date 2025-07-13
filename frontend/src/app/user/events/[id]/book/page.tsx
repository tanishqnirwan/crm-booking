"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import RoleGuard from "@/components/RoleGuard";
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, CreditCard } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Event {
  id: number;
  title: string;
  description: string;
  event_type: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  virtual_link: string;
  max_participants: number;
  current_participants: number;
  price: number;
  currency: string;
  facilitator: {
    id: number;
    name: string;
    email: string;
  };
}

export default function BookEvent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(`/events/${eventId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      setEvent(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error || "Failed to load event details");
      console.error("Event details error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookEvent = async () => {
    if (!event) return;
    
    setBookingLoading(true);
    try {
      const response = await api.post(`/user/events/${eventId}/book`, {
        notes: notes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });

      console.log("Payment initialization response:", response.data);
      const { payment_data, booking_reference } = response.data;
      
      console.log("Payment data extracted:", payment_data);
      console.log("Booking reference:", booking_reference);
      console.log("Full response data:", JSON.stringify(response.data, null, 2));
      
      if (payment_data && payment_data.order_id) {
        console.log("Payment data received:", payment_data);
        
        // Initialize Razorpay payment
        const options = {
          key: payment_data.key_id,
          amount: payment_data.amount,
          currency: payment_data.currency,
          name: "Booking System",
          description: `Booking for ${event.title}`,
          order_id: payment_data.order_id,
          handler: async function (response: unknown) {
            console.log("Payment successful:", response);
            setPaymentProcessing(true);
            toast.success("Payment successful! Confirming your booking...");
            try {
              // Confirm booking after successful payment
              await confirmBooking(booking_reference, (response as { razorpay_payment_id: string }).razorpay_payment_id);
            } catch (err: unknown) {
              console.error("Failed to confirm booking:", err);
              toast.error("Payment successful but booking confirmation failed. Please contact support.");
              setPaymentProcessing(false);
            }
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
          },
          theme: {
            color: "#3B82F6"
          },
          callback_url: `${window.location.origin}/user/bookings/${booking_reference}/payment/success`,
          cancel_url: `${window.location.origin}/user/bookings/${booking_reference}/payment/cancel`,
          modal: {
            ondismiss: function() {
              console.log("Payment cancelled");
              toast.info("Payment was cancelled");
              setBookingLoading(false);
            }
          },
          // Enable all payment methods for INR
          config: {
            display: {
              blocks: {
                banks: {
                  name: "Pay using Net Banking",
                  instruments: [
                    {
                      method: "netbanking"
                    }
                  ]
                },
                upi: {
                  name: "Pay using UPI",
                  instruments: [
                    {
                      method: "upi"
                    }
                  ]
                },
                card: {
                  name: "Pay using Card",
                  instruments: [
                    {
                      method: "card"
                    }
                  ]
                },
                wallet: {
                  name: "Pay using Wallet",
                  instruments: [
                    {
                      method: "wallet"
                    }
                  ]
                }
              },
              sequence: ["block.upi", "block.banks", "block.card", "block.wallet"],
              preferences: {
                show_default_blocks: false
              }
            }
          },
          // Force enable all payment methods
          method: {
            upi: {
              flow: "collect"
            },
            netbanking: {},
            card: {},
            wallet: {}
          }
        };

        console.log("Razorpay options:", options);

        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          console.log("Razorpay script loaded");
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        };
        script.onerror = (err: unknown) => {
          console.error("Failed to load Razorpay script:", err);
          toast.error("Failed to load payment gateway");
          setBookingLoading(false);
        };
        document.body.appendChild(script);
      } else {
        console.log("No payment data received");
        toast.error("Payment gateway initialization failed. Please try again.");
        setBookingLoading(false);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      if (error?.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to initialize payment");
      }
      console.error("Payment initialization error:", err);
      setBookingLoading(false);
    }
  };

  const confirmBooking = async (bookingReference: string, paymentId: string) => {
    try {
      toast.loading("Confirming your booking...");
      
      const response = await api.post(`/user/events/${eventId}/confirm-booking`, {
        booking_reference: bookingReference,
        payment_id: paymentId,
        notes: notes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });

      console.log("Booking confirmation response:", response.data);
      
      toast.dismiss();
      toast.success("Booking confirmed successfully!");
      
      // Redirect to success page with booking ID
      if (response.data.booking_id) {
        router.push(`/user/bookings/${response.data.booking_id}/payment/success`);
      } else {
        router.push("/user");
      }
      
    } catch (err: unknown) {
      console.error("Booking confirmation error:", err);
      toast.dismiss();
      const error = err as { response?: { data?: { error?: string } } };
      if (error?.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to confirm booking");
      }
      setPaymentProcessing(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "session":
        return "bg-blue-100 text-blue-800";
      case "workshop":
        return "bg-purple-100 text-purple-800";
      case "retreat":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["user"]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <span className="ml-4 text-lg">Loading event details...</span>
        </div>
      </RoleGuard>
    );
  }

  if (!event) {
    return (
      <RoleGuard allowedRoles={["user"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/user")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </RoleGuard>
    );
  }

  const isEventFull = event.current_participants >= event.max_participants;

  return (
    <RoleGuard allowedRoles={["user"]}>
      <div className="container mx-auto px-4 py-8">
        {/* Payment Processing Overlay */}
        {paymentProcessing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
              <p className="text-muted-foreground mb-4">
                Please wait while we confirm your payment and booking...
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Payment received</span>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Verifying with Razorpay</span>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  <span>Confirming booking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/user")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Book Event</h1>
              <p className="text-muted-foreground">Complete your booking for this event</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{event.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {event.description}
                      </CardDescription>
                    </div>
                    <Badge className={getEventTypeColor(event.event_type)}>
                      {event.event_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Date & Time</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.start_datetime).toLocaleDateString()} - {new Date(event.end_datetime).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.start_datetime).toLocaleTimeString()} - {new Date(event.end_datetime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Participants</p>
                        <p className="text-sm text-muted-foreground">
                          {event.current_participants}/{event.max_participants} spots taken
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Price</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{event.price} {event.currency}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">
                          {event.location || "Virtual event"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {event.virtual_link && (
                    <div>
                      <p className="font-medium mb-2">Virtual Meeting Link</p>
                      <a 
                        href={event.virtual_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 break-all"
                      >
                        {event.virtual_link}
                      </a>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes" className="font-medium">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requirements or notes for the facilitator..."
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Event:</span>
                    <span className="font-medium">{event.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{new Date(event.start_datetime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Facilitator:</span>
                    <span className="font-medium">{event.facilitator.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-medium text-lg">₹{event.price} {event.currency}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                  <CardDescription>
                    Secure payment via Razorpay (UPI, Net Banking, Cards, Wallets)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-medium">Razorpay</p>
                      <p className="text-sm text-muted-foreground">Secure payment processing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Button 
                  onClick={handleBookEvent}
                  className="w-full" 
                  size="lg"
                  disabled={bookingLoading || isEventFull}
                >
                  {bookingLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : isEventFull ? (
                    "Event Full"
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Book with Razorpay
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push("/user")}
                >
                  Cancel
                </Button>
              </div>

              {isEventFull && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    This event is currently full. Please check back later or contact the facilitator.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
} 