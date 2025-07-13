"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import RoleGuard from "@/components/RoleGuard";
import { 
  Calendar, 
  Users, 
  BookOpen, 
  Clock, 
  DollarSign, 
  MapPin, 
  User, 
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock3,
  ArrowLeft,
  Eye,
  Phone,
  Mail,
  ExternalLink,
  CalendarDays,
  Clock4
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface UserBooking {
  id: number;
  booking_reference: string;
  status: string;
  payment_status: string;
  notes: string;
  created_at: string;
  cancelled_at: string;
  event: {
    id: number;
    title: string;
    description: string;
    start_datetime: string;
    end_datetime: string;
    price: number;
    currency: string;
    location: string;
    virtual_link: string;
    event_type: string;
  };
  facilitator: {
    id: number;
    name: string;
    email: string;
  };
}

export default function UserBookings() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<UserBooking | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState<number | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get("/user/bookings", {
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

  const handleViewBooking = (booking: UserBooking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    
    setCancellingBooking(bookingId);
    try {
      await api.put(`/user/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      toast.success("Booking cancelled successfully");
      fetchBookings();
    } catch (error: any) {
      toast.error("Failed to cancel booking");
      console.error("Cancel booking error:", error);
    } finally {
      setCancellingBooking(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "refunded":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock3 className="h-4 w-4 text-yellow-600" />;
      case "cancelled":
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.event.start_datetime) > new Date()
  );

  const pastBookings = bookings.filter(booking => 
    new Date(booking.event.start_datetime) <= new Date()
  );

  if (loading) {
    return (
      <RoleGuard allowedRoles={["user"]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <span className="ml-4 text-lg">Loading bookings...</span>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["user"]}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
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
            <h1 className="text-3xl font-bold">My Bookings</h1>
            <p className="text-muted-foreground">Manage your event bookings</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Bookings</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{bookings.length}</div>
              <p className="text-xs text-blue-700">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{upcomingBookings.length}</div>
              <p className="text-xs text-green-700">Scheduled events</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{pastBookings.length}</div>
              <p className="text-xs text-purple-700">Past events</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                ₹{bookings.filter(b => b.payment_status === "completed").reduce((sum, b) => sum + b.event.price, 0)}
              </div>
              <p className="text-xs text-orange-700">Lifetime spending</p>
            </CardContent>
          </Card>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No bookings yet</h3>
              <p className="text-muted-foreground mb-4">
                Start exploring events to make your first booking
              </p>
              <Button onClick={() => router.push("/user")}>
                Browse Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-600" />
                  Upcoming Bookings ({upcomingBookings.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingBookings.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-lg transition-all border-2 hover:border-green-200">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{booking.event.title}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-2">
                              {booking.event.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(booking.status)}
                            <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {new Date(booking.event.start_datetime).toLocaleDateString()} - {new Date(booking.event.end_datetime).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-3 text-sm">
                            <Clock4 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {new Date(booking.event.start_datetime).toLocaleTimeString()} - {new Date(booking.event.end_datetime).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-3 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{booking.facilitator.name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-3 text-sm">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">₹{booking.event.price}</span>
                            <Badge className={`text-xs ${getPaymentStatusColor(booking.payment_status)}`}>
                              {booking.payment_status}
                            </Badge>
                          </div>

                          {booking.event.location && (
                            <div className="flex items-center space-x-3 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{booking.event.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-xs text-muted-foreground font-mono">
                            {booking.booking_reference}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewBooking(booking)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Details
                            </Button>
                            {booking.status === "confirmed" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={cancellingBooking === booking.id}
                              >
                                {cancellingBooking === booking.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Cancelling...
                                  </>
                                ) : (
                                  "Cancel"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
                  Past Bookings ({pastBookings.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastBookings.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-md transition-all bg-gray-50">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{booking.event.title}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-2">
                              {booking.event.description}
                            </CardDescription>
                          </div>
                          <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {new Date(booking.event.start_datetime).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-3 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{booking.facilitator.name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-3 text-sm">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">₹{booking.event.price}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-xs text-muted-foreground font-mono">
                            {booking.booking_reference}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBooking(booking)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Booking Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                Complete information about your booking
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Event Information</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Event Title</Label>
                        <p className="text-sm text-muted-foreground">{selectedBooking.event.title}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <p className="text-sm text-muted-foreground">{selectedBooking.event.description}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Event Type</Label>
                        <Badge className="text-xs">{selectedBooking.event.event_type}</Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Date & Time</Label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedBooking.event.start_datetime).toLocaleDateString()} - {new Date(selectedBooking.event.end_datetime).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedBooking.event.start_datetime).toLocaleTimeString()} - {new Date(selectedBooking.event.end_datetime).toLocaleTimeString()}
                        </p>
                      </div>
                      {selectedBooking.event.location && (
                        <div>
                          <Label className="text-sm font-medium">Location</Label>
                          <p className="text-sm text-muted-foreground">{selectedBooking.event.location}</p>
                        </div>
                      )}
                      {selectedBooking.event.virtual_link && (
                        <div>
                          <Label className="text-sm font-medium">Virtual Link</Label>
                          <a 
                            href={selectedBooking.event.virtual_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            Join Meeting <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Booking Information</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Booking Reference</Label>
                        <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {selectedBooking.booking_reference}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(selectedBooking.status)}
                          <Badge className={`text-xs ${getStatusColor(selectedBooking.status)}`}>
                            {selectedBooking.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Payment Status</Label>
                        <Badge className={`text-xs ${getPaymentStatusColor(selectedBooking.payment_status)}`}>
                          {selectedBooking.payment_status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Amount</Label>
                        <p className="text-lg font-semibold">₹{selectedBooking.event.price}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Booked On</Label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedBooking.created_at).toLocaleString()}
                        </p>
                      </div>
                      {selectedBooking.cancelled_at && (
                        <div>
                          <Label className="text-sm font-medium">Cancelled On</Label>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedBooking.cancelled_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {selectedBooking.notes && (
                        <div>
                          <Label className="text-sm font-medium">Notes</Label>
                          <p className="text-sm text-muted-foreground">{selectedBooking.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-2">Facilitator Information</h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedBooking.facilitator.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {selectedBooking.facilitator.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
} 