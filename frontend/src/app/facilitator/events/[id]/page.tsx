"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import RoleGuard from "@/components/RoleGuard";
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Users, DollarSign, Eye, CheckCircle, XCircle } from "lucide-react";
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
  is_active: boolean;
  created_at: string;
}

interface Booking {
  event: any;
  id: number;
  booking_reference: string;
  status: string;
  payment_status: string;
  notes: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export default function EventDetail() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isViewBookingDialogOpen, setIsViewBookingDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processingBookingId, setProcessingBookingId] = useState<number | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const [eventResponse, bookingsResponse] = await Promise.all([
        api.get(`/facilitator/events/${eventId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
        }),
        api.get(`/facilitator/bookings`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
        })
      ]);

      setEvent(eventResponse.data);
      // Filter bookings for this specific event
      const eventBookings = bookingsResponse.data.filter((booking: Booking) => 
        booking.event?.id === parseInt(eventId)
      );
      setBookings(eventBookings);
    } catch (error: any) {
      toast.error("Failed to load event details");
      console.error("Event details error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteEvent = async () => {
    try {
      await api.delete(`/facilitator/events/${eventId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      toast.success("Event deleted successfully");
      router.push("/facilitator/events");
    } catch (error: any) {
      toast.error("Failed to delete event");
      console.error("Delete error:", error);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewBookingDialogOpen(true);
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
      fetchEventDetails();
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
      fetchEventDetails();
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
          <span className="ml-4 text-lg">Loading event details...</span>
        </div>
      </RoleGuard>
    );
  }

  if (!event) {
    return (
      <RoleGuard allowedRoles={["facilitator"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/facilitator/events")}>
              Back to Events
            </Button>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["facilitator"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/facilitator/events")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{event.title}</h1>
                <p className="text-muted-foreground">Event Details</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              
              <Button
                variant="destructive"
                onClick={handleDeleteEvent}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Event Information</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={event.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {event.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge className={getEventTypeColor(event.event_type)}>
                        {event.event_type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.description || "No description provided"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Date & Time</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.start_datetime).toLocaleDateString()} - {new Date(event.end_datetime).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.start_datetime).toLocaleTimeString()} - {new Date(event.end_datetime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Participants</p>
                        <p className="text-sm text-muted-foreground">
                          {event.current_participants}/{event.max_participants}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Price</p>
                        <p className="text-sm text-muted-foreground">
                          {event.price} {event.currency}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {event.virtual_link && (
                    <div>
                      <p className="text-sm font-medium">Virtual Meeting Link</p>
                      <a 
                        href={event.virtual_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 break-all"
                      >
                        {event.virtual_link}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle>Bookings ({bookings.length})</CardTitle>
                  <CardDescription>
                    Manage bookings for this event
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No bookings yet</p>
                      <p className="text-sm">When users book this event, they will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{booking.user.name}</h4>
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                              <Badge className={getPaymentStatusColor(booking.payment_status)}>
                                {booking.payment_status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>{booking.user.email}</p>
                              <p>Booked on {new Date(booking.created_at).toLocaleDateString()}</p>
                              <p className="font-mono text-xs">Ref: {booking.booking_reference}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
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
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Bookings:</span>
                    <span className="text-sm font-medium">{bookings.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Confirmed:</span>
                    <span className="text-sm font-medium">
                      {bookings.filter(b => b.status === "confirmed").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Pending:</span>
                    <span className="text-sm font-medium">
                      {bookings.filter(b => b.status === "pending").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Revenue:</span>
                    <span className="text-sm font-medium text-green-600">
                      ${bookings.filter(b => b.status === "confirmed").length * event.price}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this event? This action cannot be undone and will cancel all existing bookings.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteEvent}>
                Delete Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Booking Dialog */}
        <Dialog open={isViewBookingDialogOpen} onOpenChange={setIsViewBookingDialogOpen}>
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
                    <Label className="font-medium">Customer</Label>
                    <p className="text-sm text-muted-foreground">{selectedBooking.user.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.user.email}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Booking Reference</Label>
                    <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {selectedBooking.booking_reference}
                    </p>
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
              <Button variant="outline" onClick={() => setIsViewBookingDialogOpen(false)}>
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
                    <strong>Customer:</strong> {selectedBooking.user.name}
                  </p>
                  <p className="text-sm text-green-700">
                    <strong>Amount:</strong> ${event.price}
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
                    <strong>Customer:</strong> {selectedBooking.user.name}
                  </p>
                  <p className="text-sm text-red-700">
                    <strong>Amount:</strong> ${event.price}
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