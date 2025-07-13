# CRM Booking System

A comprehensive booking system with CRM integration, built with Flask backend, Next.js frontend, and PostgreSQL database.

## 🏗️ Architecture

- **Frontend**: Next.js with TypeScript
- **Backend**: Flask API (booking-api) + CRM Service
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites

- Docker Desktop
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd crm-booking

# Run setup script
# Windows:
setup.bat

# Mac/Linux:
chmod +x setup.sh
./setup.sh
```

### 2. Configure Environment (Optional)

The setup script creates default environment files. For production use, edit:

- `backend/booking-api/.env` - API configuration
- `backend/crm-service/.env` - CRM service configuration

### 3. Start the Application

```bash
docker-compose up --build
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Booking API**: http://localhost:5000
- **CRM Service**: http://localhost:5001

### 5. Default Login Credentials

- **Admin**: admin@example.com / password
- **Facilitator**: facilitator@example.com / password
- **User**: user@example.com / password

## 🔧 Configuration

### Environment Variables

#### Booking API Service (`backend/booking-api/.env`)

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@db:5432/booking

# JWT Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
FLASK_SECRET_KEY=your-flask-secret-key-change-this-in-production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Razorpay Payment Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# CRM Service Configuration
CRM_URL=http://crm-service:5001/notify
CRM_BEARER_TOKEN=super-crm-token
```

#### CRM Service (`backend/crm-service/.env`)

```env
# CRM Service Configuration
CRM_BEARER_TOKEN=super-crm-token

# Gmail Configuration for Email Notifications
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
```

## 🏃‍♂️ Development

### Development Mode (Hot Reloading)

```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

### Running Individual Services

```bash
# Database only
docker-compose up db

# Backend services
docker-compose up booking-api crm-service

# Frontend only
docker-compose up frontend
```

### Viewing Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs booking-api
docker-compose logs crm-service
docker-compose logs frontend
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (database data)
docker-compose down -v
```

## 📁 Project Structure

```
crm-booking/
├── backend/
│   ├── booking-api/          # Main Flask API
│   │   ├── app.py           # Main application
│   │   ├── auth.py          # Authentication routes
│   │   ├── bookings.py      # Booking management
│   │   ├── events.py        # Event management
│   │   ├── facilitators.py  # Facilitator management
│   │   ├── models.py        # Database models
│   │   ├── requirements.txt  # Python dependencies
│   │   ├── .env.example     # Environment template
│   │   └── Dockerfile       # Booking API container
│   └── crm-service/         # CRM notification service
│       ├── app.py           # CRM service application
│       ├── requirements.txt  # Python dependencies
│       ├── .env.example     # Environment template
│       └── Dockerfile       # CRM service container
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # Next.js app router
│   │   ├── components/      # React components
│   │   └── lib/             # Utility functions
│   ├── package.json         # Node.js dependencies
│   └── Dockerfile           # Frontend container
├── database/
│   └── init.sql             # Database initialization
├── docker-compose.yml       # Docker orchestration
├── docker-compose.override.yml # Development overrides
├── setup.sh                 # Linux/Mac setup script
├── setup.bat                # Windows setup script
└── README.md                # This file
```

## 🔐 Security Notes

1. **Change Default Secrets**: Update JWT and Flask secret keys in production
2. **Database Security**: Use strong passwords for database in production
3. **OAuth Configuration**: Configure Google OAuth properly for authentication
4. **Payment Gateway**: Set up Razorpay credentials for payment processing
5. **Email Configuration**: Configure Gmail app password for notifications

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 3000, 5000, 5001, and 5432 are available
2. **Database Connection**: Check if PostgreSQL container is running
3. **Environment Variables**: Verify all required environment variables are set
4. **Build Issues**: Clear Docker cache: `docker system prune -a`

### Logs and Debugging

```bash
# Check service status
docker-compose ps

# View real-time logs
docker-compose logs -f

# Access container shell
docker-compose exec booking-api bash
docker-compose exec crm-service bash
docker-compose exec frontend sh
```

## 📝 API Documentation

### Booking API Endpoints

- `GET /` - Health check
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /events` - List events
- `POST /events` - Create event
- `GET /bookings` - List bookings
- `POST /bookings` - Create booking

### CRM Service Endpoints

- `POST /notify` - Send notifications
- `GET /notifications` - Get notifications
- `DELETE /notifications/<id>` - Delete notification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker Compose
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 