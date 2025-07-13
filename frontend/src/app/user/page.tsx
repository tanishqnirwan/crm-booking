"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RoleGuard from "@/components/RoleGuard";
import { 
  Calendar, 
  Users, 
  BookOpen, 
  Clock, 
  DollarSign, 
  Search, 
  Filter, 
  MapPin, 
  User, 
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Star,
  ArrowRight,
  Play,
  Clock3
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface UserBooking {
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

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("all");

  useEffect(() => {
    // Check if user has a role, if not redirect to choose-role
    if (user && !user.role) {
      router.push("/choose-role");
      return;
    }
    
    // Check if user is not a user role, redirect appropriately
    if (user && user.role !== "user") {
      if (user.role === "facilitator") {
        router.push("/facilitator");
      } else {
        router.push("/choose-role");
      }
      return;
    }

    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch events first (this should work)
      try {
        const eventsResponse = await api.get("/events", {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
        });
        setEvents(eventsResponse.data);
      } catch (eventsError: any) {
        console.error("Events error:", eventsError);
        toast.error("Failed to load events");
      }

      // Fetch bookings separately
      try {
        const bookingsResponse = await api.get("/user/bookings", {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
        });
        setBookings(bookingsResponse.data);
      } catch (bookingsError: any) {
        console.error("Bookings error:", bookingsError);
        toast.error("Failed to load bookings");
      }
    } catch (error: any) {
      toast.error("Failed to load dashboard data");
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleBookEvent = (eventId: number) => {
    router.push(`/user/events/${eventId}/book`);
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

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "session":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "workshop":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "retreat":
        return "bg-orange-100 text-orange-800 border-orange-200";
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

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedEventType === "all" || event.event_type === selectedEventType;
    return matchesSearch && matchesType;
  });

  const upcomingBookings = bookings.filter(booking => 
    new Date(booking.event.start_datetime) > new Date()
  );

  const pastBookings = bookings.filter(booking => 
    new Date(booking.event.start_datetime) <= new Date()
  );

  const totalSpent = bookings
    .filter(booking => booking.payment_status === "completed")
    .reduce((sum, booking) => sum + booking.event.price, 0);

  if (loading) {
    return (
      <RoleGuard allowedRoles={["user"]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <span className="ml-4 text-lg">Loading dashboard...</span>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["user"]}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-muted-foreground mt-2">Discover amazing events and manage your bookings</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Bookings</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{bookings.length}</div>
              <p className="text-xs text-blue-700">Your bookings</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Upcoming Events</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{upcomingBookings.length}</div>
              <p className="text-xs text-green-700">Scheduled events</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Available Events</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{events.length}</div>
              <p className="text-xs text-purple-700">Events to explore</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">₹{totalSpent}</div>
              <p className="text-xs text-orange-700">Lifetime spending</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Bookings */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle>My Bookings</CardTitle>
                </div>
                <CardDescription>
                  Your upcoming and past bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Start exploring events to make your first booking
                    </p>
                    <Button 
                      onClick={() => document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' })}
                      size="sm"
                    >
                      Browse Events
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Upcoming Bookings */}
                    {upcomingBookings.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Upcoming ({upcomingBookings.length})
                        </h4>
                        <div className="space-y-3">
                          {upcomingBookings.map((booking) => (
                            <div key={booking.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition-all">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-semibold text-sm line-clamp-2">{booking.event.title}</h4>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(booking.status)}
                                  <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(booking.event.start_datetime).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <User className="h-3 w-3" />
                                  <span>{booking.facilitator.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <CreditCard className="h-3 w-3" />
                                  <span className="font-mono text-xs">₹{booking.event.price}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Past Bookings */}
                    {pastBookings.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Past ({pastBookings.length})
                        </h4>
                        <div className="space-y-3">
                          {pastBookings.slice(0, 3).map((booking) => (
                            <div key={booking.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-sm line-clamp-1">{booking.event.title}</h4>
                                <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                                  {booking.status}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(booking.event.start_datetime).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {pastBookings.length > 3 && (
                            <Button variant="ghost" size="sm" className="w-full text-xs">
                              View all {pastBookings.length} past bookings
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Available Events */}
          <div className="lg:col-span-2" id="events-section">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <CardTitle>Available Events</CardTitle>
                    </div>
                    <CardDescription>
                      Discover amazing events from our expert facilitators
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {filteredEvents.length} events
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search events by title or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="session">Sessions</SelectItem>
                      <SelectItem value="workshop">Workshops</SelectItem>
                      <SelectItem value="retreat">Retreats</SelectItem>
                      <SelectItem value="class">Classes</SelectItem>
                      <SelectItem value="seminar">Seminars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">No events found</h3>
                    <p className="text-muted-foreground text-sm">
                      Try adjusting your search or filters
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredEvents.map((event) => (
                      <Card key={event.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                {event.title}
                              </CardTitle>
                              <CardDescription className="line-clamp-2 mt-2">
                                {event.description}
                              </CardDescription>
                            </div>
                            <Badge className={`${getEventTypeColor(event.event_type)} ml-2`}>
                              {event.event_type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {new Date(event.start_datetime).toLocaleDateString()} - {new Date(event.end_datetime).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-3 text-sm">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {event.current_participants}/{event.max_participants} participants
                              </span>
                              {event.current_participants >= event.max_participants && (
                                <Badge variant="destructive" className="text-xs">Full</Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-3 text-sm">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold text-lg">₹{event.price}</span>
                            </div>

                            {event.location && (
                              <div className="flex items-center space-x-3 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{event.location}</span>
                              </div>
                            )}

                            <div className="flex items-center space-x-3 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">by {event.facilitator.name}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm text-muted-foreground">Expert facilitator</span>
                            </div>
                            <Button
                              onClick={() => handleBookEvent(event.id)}
                              size="sm"
                              disabled={event.current_participants >= event.max_participants}
                              className="group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                            >
                              {event.current_participants >= event.max_participants ? (
                                "Event Full"
                              ) : (
                                <>
                                  Book Now
                                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
} 