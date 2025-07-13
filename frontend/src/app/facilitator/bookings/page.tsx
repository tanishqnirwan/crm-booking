"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import RoleGuard from "@/components/RoleGuard";
import { CheckCircle, XCircle, Eye, Calendar, User, DollarSign, Clock } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Booking {
  id: number;
  booking_reference: string;
  status: string;
  payment_status: string;
  notes: string;
  created_at: string;
  cancelled_at: string | null;
  event: {
    id: number;
    title: string;
    start_datetime: string;
    end_datetime: string;
    price: number;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export default function FacilitatorBookings() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processingBookingId, setProcessingBookingId] = useState<number | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get("/facilitator/bookings", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      setBookings(response.data);
    } catch (error: any) {
      toast.error("Failed to load bookings");
      console.error("Bookings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleApproveBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsApproveDialogOpen(true);
  };

  const handleRejectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsRejectDialogOpen(true);
  };

  const confirmApproveBooking = async () => {
    if (!selectedBooking) return;
    
    setProcessingBookingId(selectedBooking.id);
    try {
      await api.put(`/facilitator/bookings/${selectedBooking.id}/approve`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      toast.success("Booking approved successfully");
      fetchBookings();
      setIsApproveDialogOpen(false);
      setSelectedBooking(null);
    } catch (error: any) {
      toast.error("Failed to approve booking");
      console.error("Approve error:", error);
    } finally {
      setProcessingBookingId(null);
    }
  };

  const confirmRejectBooking = async () => {
    if (!selectedBooking) return;
    
    setProcessingBookingId(selectedBooking.id);
    try {
      await api.put(`/facilitator/bookings/${selectedBooking.id}/reject`, {
        reason: rejectReason
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      toast.success("Booking rejected successfully");
      fetchBookings();
      setIsRejectDialogOpen(false);
      setSelectedBooking(null);
      setRejectReason("");
    } catch (error: any) {
      toast.error("Failed to reject booking");
      console.error("Reject error:", error);
    } finally {
      setProcessingBookingId(null);
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
      case "rejected":
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
      case "refunded":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canApprove = (booking: Booking) => {
    return booking.status === "pending" && booking.payment_status === "pending";
  };

  const canReject = (booking: Booking) => {
    return booking.status === "pending";
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Bookings</h1>
            <p className="text-muted-foreground">Manage bookings for your events</p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
              <p className="text-muted-foreground mb-4">
                When users book your events, they will appear here
              </p>
              <Button onClick={() => router.push("/facilitator/events")}>
                View My Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{booking.user.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(booking.event.start_datetime).toLocaleDateString()} - {new Date(booking.event.end_datetime).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span>${booking.event.price}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Booked on {new Date(booking.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">Booking Reference:</span>
                            <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {booking.booking_reference}
                            </span>
                          </div>
                          {booking.notes && (
                            <div className="text-sm">
                              <span className="font-medium">Notes:</span>
                              <p className="text-muted-foreground mt-1">{booking.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewBooking(booking)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {canApprove(booking) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveBooking(booking)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {canReject(booking) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectBooking(booking)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Booking Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                Detailed information about this booking
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Event</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.event.title}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Booking Reference</Label>
                    <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {selectedBooking.booking_reference}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Customer</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.user.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.user.email}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Amount</Label>
                    <p className="text-sm text-muted-foreground">${selectedBooking.event.price}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Status</Label>
                    <Badge className={getStatusColor(selectedBooking.status)}>
                      {selectedBooking.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-medium">Payment Status</Label>
                    <Badge className={getPaymentStatusColor(selectedBooking.payment_status)}>
                      {selectedBooking.payment_status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-medium">Event Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedBooking.event.start_datetime).toLocaleDateString()} - {new Date(selectedBooking.event.end_datetime).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Booked On</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedBooking.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {selectedBooking.notes && (
                  <div>
                    <Label className="font-medium">Notes</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve Booking Dialog */}
        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this booking? This will confirm the booking and mark the payment as completed.
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Booking Details</h4>
                  <p className="text-sm text-green-700">
                    <strong>Event:</strong> {selectedBooking.event.title}
                  </p>
                  <p className="text-sm text-green-700">
                    <strong>Customer:</strong> {selectedBooking.user.name}
                  </p>
                  <p className="text-sm text-green-700">
                    <strong>Amount:</strong> ${selectedBooking.event.price}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmApproveBooking}
                disabled={processingBookingId === selectedBooking?.id}
                className="bg-green-600 hover:bg-green-700"
              >
                {processingBookingId === selectedBooking?.id ? "Approving..." : "Approve Booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Booking Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject this booking? This will cancel the booking and refund the payment.
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Booking Details</h4>
                  <p className="text-sm text-red-700">
                    <strong>Event:</strong> {selectedBooking.event.title}
                  </p>
                  <p className="text-sm text-red-700">
                    <strong>Customer:</strong> {selectedBooking.user.name}
                  </p>
                  <p className="text-sm text-red-700">
                    <strong>Amount:</strong> ${selectedBooking.event.price}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="reject-reason">Reason for Rejection (Optional)</Label>
                  <Textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmRejectBooking}
                disabled={processingBookingId === selectedBooking?.id}
              >
                {processingBookingId === selectedBooking?.id ? "Rejecting..." : "Reject Booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
} 