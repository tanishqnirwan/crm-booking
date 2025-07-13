"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import RoleGuard from "@/components/RoleGuard";
import { ArrowLeft, Save, Calendar, MapPin, Users, DollarSign } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function CreateEvent() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "session",
    start_datetime: "",
    end_datetime: "",
    location: "",
    virtual_link: "",
    max_participants: 10,
    price: 0,
    currency: "INR",
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      // Validate form data
      if (!formData.title || !formData.start_datetime || !formData.end_datetime) {
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      if (new Date(formData.start_datetime) >= new Date(formData.end_datetime)) {
        toast.error("End time must be after start time");
        setLoading(false);
        return;
      }

      if (formData.max_participants < 1) {
        toast.error("Maximum participants must be at least 1");
        setLoading(false);
        return;
      }

      if (formData.price < 0) {
        toast.error("Price cannot be negative");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await api.post("/events", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success("Event created successfully!");
      router.push("/facilitator/events");
    } catch (error: any) {
      console.error("Create event error:", error);
      
      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.error || error.response.data?.message || "Failed to create event";
        toast.error(errorMessage);
      } else if (error.request) {
        // Network error
        toast.error("Network error. Please check your connection.");
      } else {
        // Other error
        toast.error("Failed to create event. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };



  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <RoleGuard allowedRoles={["facilitator"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/facilitator/events")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create New Event</h1>
              <p className="text-muted-foreground">Set up your event details and pricing</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Information</CardTitle>
                    <CardDescription>
                      Basic details about your event
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Event Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="Enter event title"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Describe your event..."
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event_type">Event Type</Label>
                        <Select value={formData.event_type} onValueChange={(value) => handleInputChange("event_type", value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="session">Session</SelectItem>
                            <SelectItem value="workshop">Workshop</SelectItem>
                            <SelectItem value="retreat">Retreat</SelectItem>
                            <SelectItem value="class">Class</SelectItem>
                            <SelectItem value="seminar">Seminar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                                                  <SelectContent>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                        </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Schedule</span>
                    </CardTitle>
                    <CardDescription>
                      Set the date and time for your event
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_datetime">Start Date & Time *</Label>
                        <Input
                          id="start_datetime"
                          type="datetime-local"
                          value={formData.start_datetime}
                          onChange={(e) => handleInputChange("start_datetime", e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="end_datetime">End Date & Time *</Label>
                        <Input
                          id="end_datetime"
                          type="datetime-local"
                          value={formData.end_datetime}
                          onChange={(e) => handleInputChange("end_datetime", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Location</span>
                    </CardTitle>
                    <CardDescription>
                      Physical location or virtual meeting details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="location">Physical Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="Venue address or location"
                      />
                    </div>

                    <div>
                      <Label htmlFor="virtual_link">Virtual Meeting Link</Label>
                      <Input
                        id="virtual_link"
                        value={formData.virtual_link}
                        onChange={(e) => handleInputChange("virtual_link", e.target.value)}
                        placeholder="Zoom, Teams, or other virtual meeting link"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Capacity & Pricing</span>
                    </CardTitle>
                    <CardDescription>
                      Set participant limits and pricing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="max_participants">Maximum Participants</Label>
                      <Input
                        id="max_participants"
                        type="number"
                        value={formData.max_participants}
                        onChange={(e) => handleInputChange("max_participants", parseInt(e.target.value))}
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Price</Label>
                      <div className="relative">
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => handleInputChange("price", parseFloat(e.target.value))}
                          min="0"
                          required
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          ₹
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                      />
                      <Label htmlFor="is_active">Event is active</Label>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Event Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Event Type:</span>
                      <span className="text-sm font-medium capitalize">{formData.event_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Max Participants:</span>
                      <span className="text-sm font-medium">{formData.max_participants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <span className="text-sm font-medium">
                        ₹{formData.price}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <span className={`text-sm font-medium ${formData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {formData.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Creating Event...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Event
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push("/facilitator/events")}
                  >
                    Cancel
                  </Button>
                  

                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </RoleGuard>
  );
} 