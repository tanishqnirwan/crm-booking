"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Users, DollarSign, Edit, Trash2, Plus, Loader2 } from "lucide-react";

interface Event {
  id: number;
  title: string;
  description: string;
  event_type: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  virtual_link?: string;
  max_participants: number;
  current_participants: number;
  price: number;
  currency: string;
  facilitator?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function EventsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<number | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await api.get("/events");
        setEvents(res.data);
      } catch {
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleBook = async (eventId: number) => {
    setBooking(eventId);
    try {
      await api.post("/bookings", { event_id: eventId });
      toast.success("Booking successful!");
      setEvents(events => events.map(ev => ev.id === eventId ? { ...ev, current_participants: ev.current_participants + 1 } : ev));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Booking failed");
    } finally {
      setBooking(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isFacilitator = user?.role === "facilitator";
  const isMyEvent = (event: Event) => isFacilitator && event.facilitator?.id === user?.id;

  // Debug logging
  console.log("User:", user);
  console.log("Is Facilitator:", isFacilitator);
  console.log("User role:", user?.role);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading events...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Events & Sessions</h1>
              <p className="text-gray-600">Discover and book amazing sessions and retreats</p>
            </div>
            {isFacilitator && (
              <Button 
                onClick={() => {
                  console.log("Create Event button clicked");
                  console.log("User role:", user?.role);
                  router.push("/events/create");
                }} 
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            )}
          </div>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <Calendar className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500">Check back later for new events and sessions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <Card key={event.id} className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                        {event.title}
                      </CardTitle>
                      <Badge variant="secondary" className="mb-3">
                        {event.event_type}
                      </Badge>
                    </div>
                    {isMyEvent(event) && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/events/${event.id}/edit`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/events/${event.id}/cancel`)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Event Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{formatDateTime(event.start_datetime)} - {formatDateTime(event.end_datetime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    
                    {event.facilitator && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Facilitator:</span> {event.facilitator.name}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Description */}
                  <p className="text-gray-700 mb-4 line-clamp-3">{event.description}</p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <div className="text-sm">
                        <div className="font-medium">{event.current_participants}/{event.max_participants}</div>
                        <div className="text-xs text-gray-500">Participants</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div className="text-sm">
                        <div className="font-medium">{event.price} {event.currency}</div>
                        <div className="text-xs text-gray-500">Price</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <Badge 
                        variant={event.current_participants >= event.max_participants ? "destructive" : "default"}
                        className="text-xs"
                      >
                        {event.current_participants >= event.max_participants ? "Full" : "Available"}
                      </Badge>
                    </div>
                  </div>

                  {/* Virtual Link */}
                  {event.virtual_link && (
                    <div className="mb-4">
                      <a 
                        href={event.virtual_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                      >
                        <Calendar className="h-3 w-3" />
                        Join Virtual Session
                      </a>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2">
                    {isMyEvent(event) ? (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push(`/events/${event.id}/edit`)} size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="destructive" onClick={() => router.push(`/events/${event.id}/cancel`)} size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleBook(event.id)}
                        disabled={booking === event.id || event.current_participants >= event.max_participants}
                        size="sm"
                        className="w-full"
                        variant={event.current_participants >= event.max_participants ? "secondary" : "default"}
                      >
                        {booking === event.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Booking...
                          </>
                        ) : event.current_participants >= event.max_participants ? (
                          "Fully Booked"
                        ) : (
                          "Book Now"
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 