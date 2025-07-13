# CRM Booking System - API Documentation

## 🔗 Base URLs
- **Booking API**: `http://localhost:5000`
- **CRM Service**: `http://localhost:5001`

## 🔐 Authentication

### JWT Token Format
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Token Response Format
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

---

## 📋 Booking API Endpoints

### Authentication Endpoints

#### 1. User Registration
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Email already exists"
}
```

---

#### 2. User Login
**POST** `/auth/login`

Authenticate user and get JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid credentials"
}
```

---

#### 3. Google OAuth Login
**GET** `/auth/google`

Redirect to Google OAuth for authentication.

**Response:** Redirects to Google OAuth consent screen.

---

#### 4. Google OAuth Callback
**GET** `/auth/google/callback`

Handle Google OAuth callback and create/login user.

**Response (200 OK):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "name": "John Doe",
    "role": "user",
    "google_id": "123456789",
    "profile_picture": "https://lh3.googleusercontent.com/..."
  }
}
```

---

#### 5. Refresh Token
**POST** `/auth/refresh`

Get new access token using refresh token.

**Headers:**
```
Authorization: Bearer <refresh-token>
```

**Response (200 OK):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

---

### Event Endpoints

#### 6. List All Events
**GET** `/events`

Get all available events (public endpoint).

**Query Parameters:**
- `type` (optional): Filter by event type (session, workshop, retreat)
- `facilitator_id` (optional): Filter by facilitator
- `active` (optional): Filter by active status (true/false)

**Response (200 OK):**
```json
{
  "events": [
    {
      "id": 1,
      "title": "Yoga Session",
      "description": "A relaxing yoga session for beginners",
      "event_type": "session",
      "start_datetime": "2024-02-15T10:00:00",
      "end_datetime": "2024-02-15T11:00:00",
      "location": "Studio A",
      "virtual_link": null,
      "max_participants": 10,
      "current_participants": 5,
      "price": 25.00,
      "currency": "INR",
      "is_active": true,
      "facilitator": {
        "id": 2,
        "name": "John Facilitator",
        "email": "facilitator@example.com"
      },
      "created_at": "2024-02-01T10:00:00"
    }
  ]
}
```

---

#### 7. Get Single Event
**GET** `/events/{event_id}`

Get details of a specific event.

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Yoga Session",
  "description": "A relaxing yoga session for beginners",
  "event_type": "session",
  "start_datetime": "2024-02-15T10:00:00",
  "end_datetime": "2024-02-15T11:00:00",
  "location": "Studio A",
  "virtual_link": null,
  "max_participants": 10,
  "current_participants": 5,
  "price": 25.00,
  "currency": "INR",
  "is_active": true,
  "facilitator": {
    "id": 2,
    "name": "John Facilitator",
    "email": "facilitator@example.com"
  },
  "created_at": "2024-02-01T10:00:00"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Event not found"
}
```

---

#### 8. Create Event (Facilitator Only)
**POST** `/events`

Create a new event (requires facilitator role).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "New Yoga Session",
  "description": "Advanced yoga session for experienced practitioners",
  "event_type": "session",
  "start_datetime": "2024-02-20T10:00:00",
  "end_datetime": "2024-02-20T11:00:00",
  "location": "Studio B",
  "virtual_link": "https://meet.google.com/abc-defg-hij",
  "max_participants": 15,
  "price": 30.00,
  "currency": "INR"
}
```

**Response (201 Created):**
```json
{
  "message": "Event created successfully",
  "event": {
    "id": 3,
    "title": "New Yoga Session",
    "description": "Advanced yoga session for experienced practitioners",
    "event_type": "session",
    "start_datetime": "2024-02-20T10:00:00",
    "end_datetime": "2024-02-20T11:00:00",
    "location": "Studio B",
    "virtual_link": "https://meet.google.com/abc-defg-hij",
    "max_participants": 15,
    "current_participants": 0,
    "price": 30.00,
    "currency": "INR",
    "is_active": true,
    "facilitator": {
      "id": 2,
      "name": "John Facilitator",
      "email": "facilitator@example.com"
    },
    "created_at": "2024-02-10T15:30:00"
  }
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "Only facilitators can create events"
}
```

---

#### 9. Update Event (Facilitator Only)
**PUT** `/events/{event_id}`

Update an existing event (requires facilitator role).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Yoga Session",
  "description": "Updated description",
  "max_participants": 20,
  "price": 35.00
}
```

**Response (200 OK):**
```json
{
  "message": "Event updated successfully",
  "event": {
    "id": 1,
    "title": "Updated Yoga Session",
    "description": "Updated description",
    "max_participants": 20,
    "price": 35.00,
    ...
  }
}
```

---

#### 10. Delete Event (Facilitator Only)
**DELETE** `/events/{event_id}`

Delete an event (requires facilitator role).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Event deleted successfully"
}
```

---

### Booking Endpoints

#### 11. Create Booking
**POST** `/bookings`

Create a new booking for an event.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "event_id": 1,
  "notes": "Special requirements: Beginner level"
}
```

**Response (201 Created):**
```json
{
  "message": "Booking created successfully",
  "booking": {
    "id": 1,
    "booking_reference": "BK2024001",
    "status": "confirmed",
    "notes": "Special requirements: Beginner level",
    "payment_status": "pending",
    "payment_id": null,
    "payment_reference": null,
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "event": {
      "id": 1,
      "title": "Yoga Session",
      "price": 25.00,
      "currency": "INR"
    },
    "created_at": "2024-02-10T15:30:00"
  },
  "payment_url": "https://razorpay.com/pay/rzp_test_1234567890"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Event is full"
}
```

---

#### 12. List User Bookings
**GET** `/bookings`

Get all bookings for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by booking status (confirmed, cancelled, completed)
- `payment_status` (optional): Filter by payment status (pending, completed, failed)

**Response (200 OK):**
```json
{
  "bookings": [
    {
      "id": 1,
      "booking_reference": "BK2024001",
      "status": "confirmed",
      "notes": "Special requirements",
      "payment_status": "completed",
      "payment_id": "pay_1234567890",
      "payment_reference": "ref_1234567890",
      "cancelled_at": null,
      "event": {
        "id": 1,
        "title": "Yoga Session",
        "start_datetime": "2024-02-15T10:00:00",
        "end_datetime": "2024-02-15T11:00:00",
        "location": "Studio A",
        "price": 25.00,
        "currency": "INR"
      },
      "created_at": "2024-02-10T15:30:00"
    }
  ]
}
```

---

#### 13. Get Single Booking
**GET** `/bookings/{booking_id}`

Get details of a specific booking.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "booking_reference": "BK2024001",
  "status": "confirmed",
  "notes": "Special requirements",
  "payment_status": "completed",
  "payment_id": "pay_1234567890",
  "payment_reference": "ref_1234567890",
  "cancelled_at": null,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "event": {
    "id": 1,
    "title": "Yoga Session",
    "description": "A relaxing yoga session",
    "start_datetime": "2024-02-15T10:00:00",
    "end_datetime": "2024-02-15T11:00:00",
    "location": "Studio A",
    "price": 25.00,
    "currency": "INR"
  },
  "created_at": "2024-02-10T15:30:00"
}
```

---

#### 14. Cancel Booking
**POST** `/bookings/{booking_id}/cancel`

Cancel a booking and process refund.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Booking cancelled successfully",
  "refund": {
    "refund_id": "rfnd_1234567890",
    "amount": 25.00,
    "currency": "INR",
    "status": "processed"
  }
}
```

---

### Payment Endpoints

#### 15. Payment Success Callback
**POST** `/payment/success`

Handle successful payment from Razorpay.

**Request Body:**
```json
{
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_order_id": "order_1234567890",
  "razorpay_signature": "signature_hash"
}
```

**Response (200 OK):**
```json
{
  "message": "Payment processed successfully",
  "booking": {
    "id": 1,
    "booking_reference": "BK2024001",
    "payment_status": "completed"
  }
}
```

---

#### 16. Payment Failure Callback
**POST** `/payment/failure`

Handle failed payment from Razorpay.

**Request Body:**
```json
{
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_order_id": "order_1234567890",
  "error_code": "PAYMENT_DECLINED",
  "error_description": "Payment was declined by the bank"
}
```

**Response (200 OK):**
```json
{
  "message": "Payment failure recorded",
  "booking": {
    "id": 1,
    "booking_reference": "BK2024001",
    "payment_status": "failed"
  }
}
```

---

### Facilitator Endpoints

#### 17. List Facilitator Events
**GET** `/facilitator/events`

Get all events created by the authenticated facilitator.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "events": [
    {
      "id": 1,
      "title": "Yoga Session",
      "description": "A relaxing yoga session",
      "event_type": "session",
      "start_datetime": "2024-02-15T10:00:00",
      "end_datetime": "2024-02-15T11:00:00",
      "location": "Studio A",
      "max_participants": 10,
      "current_participants": 5,
      "price": 25.00,
      "currency": "INR",
      "is_active": true,
      "created_at": "2024-02-01T10:00:00"
    }
  ]
}
```

---

#### 18. Get Event Bookings (Facilitator)
**GET** `/facilitator/events/{event_id}/bookings`

Get all bookings for a specific event (facilitator only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "event": {
    "id": 1,
    "title": "Yoga Session",
    "max_participants": 10,
    "current_participants": 5
  },
  "bookings": [
    {
      "id": 1,
      "booking_reference": "BK2024001",
      "status": "confirmed",
      "payment_status": "completed",
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "created_at": "2024-02-10T15:30:00"
    }
  ]
}
```

---

#### 19. Cancel Event (Facilitator)
**POST** `/facilitator/events/{event_id}/cancel`

Cancel an event and refund all bookings (facilitator only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Event cancelled successfully",
  "refunds_processed": 5,
  "total_refund_amount": 125.00
}
```

---

### User Profile Endpoints

#### 20. Get User Profile
**GET** `/profile`

Get current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "user",
  "is_active": true,
  "is_verified": true,
  "created_at": "2024-01-01T10:00:00"
}
```

---

#### 21. Update User Profile
**PUT** `/profile`

Update current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+1234567890"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Updated",
    "phone": "+1234567890",
    "role": "user"
  }
}
```

---

## 🔔 CRM Service Endpoints

### Notification Endpoints

#### 22. Send Notification
**POST** `/notify`

Send booking notification to CRM service.

**Headers:**
```
Authorization: Bearer super-crm-token
Content-Type: application/json
```

**Request Body:**
```json
{
  "booking_id": 1,
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "event": {
    "title": "Yoga Session",
    "facilitator_id": 2
  },
  "action": "payment_completed"
}
```

**Response (200 OK):**
```json
{
  "message": "Notification sent successfully",
  "notification_id": 1,
  "email_sent": true
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Missing required fields",
  "missing_fields": ["booking_id", "user"]
}
```

---

#### 23. Get Notifications
**GET** `/notifications`

Get all notifications (for debugging/monitoring).

**Headers:**
```
Authorization: Bearer super-crm-token
```

**Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": 1,
      "booking_id": 1,
      "status": "sent",
      "sent_at": "2024-02-10T15:35:00",
      "response": "Email sent successfully to facilitator@example.com"
    }
  ]
}
```

---

#### 24. Delete Notification
**DELETE** `/notifications/{notification_id}`

Delete a specific notification.

**Headers:**
```
Authorization: Bearer super-crm-token
```

**Response (200 OK):**
```json
{
  "message": "Notification deleted successfully"
}
```

---

#### 25. Clear All Notifications
**DELETE** `/notifications/clear`

Clear all notifications.

**Headers:**
```
Authorization: Bearer super-crm-token
```

**Response (200 OK):**
```json
{
  "message": "All notifications cleared",
  "deleted_count": 10
}
```

---

#### 26. Test Email
**POST** `/test-email`

Test email functionality.

**Headers:**
```
Authorization: Bearer super-crm-token
Content-Type: application/json
```

**Request Body:**
```json
{
  "to_email": "test@example.com",
  "subject": "Test Email",
  "html_content": "<h1>Test Email</h1><p>This is a test email.</p>"
}
```

**Response (200 OK):**
```json
{
  "message": "Test email sent successfully",
  "email_sent": true
}
```

---

#### 27. Test Gmail Authentication
**GET** `/test-gmail-auth`

Test Gmail SMTP authentication.

**Headers:**
```
Authorization: Bearer super-crm-token
```

**Response (200 OK):**
```json
{
  "message": "Gmail authentication successful",
  "authenticated": true,
  "gmail_user": "your-email@gmail.com"
}
```

---

## 📊 Health Check Endpoints

#### 28. Booking API Health Check
**GET** `/`

**Response (200 OK):**
```json
{
  "message": "Booking System API is running!",
  "status": "healthy",
  "timestamp": "2024-02-10T15:30:00"
}
```

---

## 🔧 Error Responses

### Common Error Formats

#### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": {
    "field": "error message"
  }
}
```

#### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

#### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

#### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Something went wrong"
}
```

---

## 🔐 Authentication Flow

1. **Register/Login**: Get JWT tokens
2. **Use Access Token**: Include in Authorization header
3. **Token Expiry**: Use refresh token to get new access token
4. **CRM Service**: Use Bearer token for CRM endpoints

---

## 📝 Usage Examples

### Complete Booking Flow
1. Register/Login user
2. Browse events
3. Create booking
4. Process payment
5. Receive confirmation

### Facilitator Flow
1. Login as facilitator
2. Create events
3. View bookings
4. Manage events
5. Cancel events if needed

---

## 🚀 Testing the API

### Using curl
```bash
# Register user
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get events (with token)
curl -X GET http://localhost:5000/events \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman
1. Import the endpoints
2. Set up environment variables for tokens
3. Test the complete flow

---

## 📚 Additional Notes

- All timestamps are in ISO 8601 format
- Currency is in INR by default
- Payment integration uses Razorpay
- Email notifications use Gmail SMTP
- Database uses PostgreSQL
- JWT tokens expire in 24 hours
- Refresh tokens are valid for 30 days 