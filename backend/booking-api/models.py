from extensions import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255))
    google_id = db.Column(db.String(100), unique=True)
    profile_picture = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    role = db.Column(db.String(20), nullable=False, default='user')
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Relationships
    bookings = db.relationship('Booking', backref='user', lazy=True)
    events = db.relationship('Event', backref='user', lazy=True)

class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    event_type = db.Column(db.String(50), nullable=False)
    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(255))
    virtual_link = db.Column(db.String(255))
    max_participants = db.Column(db.Integer, nullable=False, default=1)
    current_participants = db.Column(db.Integer, nullable=False, default=0)
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    currency = db.Column(db.String(3), nullable=False, default='INR')
    is_active = db.Column(db.Boolean, default=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Relationships
    bookings = db.relationship('Booking', backref='event', lazy=True)

class Booking(db.Model):
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    booking_reference = db.Column(db.String(50), unique=True, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='confirmed')
    notes = db.Column(db.Text)
    payment_status = db.Column(db.String(20), nullable=False, default='pending')
    payment_id = db.Column(db.String(100))  # PayPal payment ID
    payment_reference = db.Column(db.String(100))
    cancelled_at = db.Column(db.DateTime)
    crm_notified = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'))
    event_id = db.Column(db.Integer, db.ForeignKey('events.id', ondelete='CASCADE'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Relationships
    crm_notifications = db.relationship('CRMNotification', backref='booking', lazy=True)
    transactions = db.relationship('Transaction', backref='booking', lazy=True)

class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'), nullable=False)
    payment_id = db.Column(db.String(100), nullable=False)  # PayPal payment ID
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default='INR')
    status = db.Column(db.String(20), nullable=False, default='pending')
    payment_method = db.Column(db.String(20), nullable=False, default='razorpay')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CRMNotification(db.Model):
    __tablename__ = 'crm_notifications'
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete='CASCADE'))
    status = db.Column(db.String(20), nullable=False)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)
    response = db.Column(db.Text) 