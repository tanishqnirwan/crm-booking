from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Event, Booking, User, Transaction
from extensions import db
from datetime import datetime
import uuid
import os
import requests
import razorpay

bp = Blueprint('bookings', __name__)

@bp.route('/user/bookings', methods=['GET'])
@jwt_required()
def user_bookings():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'user':
        return jsonify({'error': 'Not authorized'}), 403
    
    bookings = Booking.query.filter_by(user_id=user_id).order_by(Booking.created_at.desc()).all()
    result = []
    for booking in bookings:
        event = Event.query.get(booking.event_id)
        facilitator = User.query.get(event.user_id) if event else None
        result.append({
            'id': booking.id,
            'booking_reference': booking.booking_reference,
            'status': booking.status,
            'payment_status': booking.payment_status,
            'notes': booking.notes,
            'created_at': booking.created_at.isoformat() if booking.created_at else None,
            'cancelled_at': booking.cancelled_at.isoformat() if booking.cancelled_at else None,
            'event': {
                'id': event.id if event else None,
                'title': event.title if event else None,
                'start_datetime': event.start_datetime.isoformat() if event and event.start_datetime else None,
                'end_datetime': event.end_datetime.isoformat() if event and event.end_datetime else None,
                'price': float(event.price) if event else 0,
                'currency': event.currency if event else 'INR',
                'location': event.location if event else None,
                'virtual_link': event.virtual_link if event else None
            } if event else None,
            'facilitator': {
                'id': facilitator.id if facilitator else None,
                'name': facilitator.name if facilitator else None,
                'email': facilitator.email if facilitator else None
            } if facilitator else None
        })
    return jsonify(result)

@bp.route('/user/events/<int:event_id>/book', methods=['POST'])
@jwt_required()
def book_event(event_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'user':
        return jsonify({'error': 'Not authorized'}), 403
    
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    if not event.is_active:
        return jsonify({'error': 'Event is not active'}), 400
    
    if event.current_participants >= event.max_participants:
        return jsonify({'error': 'Event is full'}), 400
    
    # Check if user already has a booking for this event
    existing_booking = Booking.query.filter_by(user_id=user_id, event_id=event_id).first()
    if existing_booking:
        return jsonify({'error': 'You already have a booking for this event'}), 400
    
    data = request.get_json()
    notes = data.get('notes', '')
    
    try:
        # Generate booking reference first
        booking_reference = f"BK-{uuid.uuid4().hex[:8].upper()}"
        
        # Create Razorpay payment first (without creating booking)
        payment_data = create_razorpay_payment_for_event(event, booking_reference, user_id, notes)
        
        if not payment_data:
            return jsonify({'error': 'Payment gateway initialization failed. Please try again.'}), 400
        
        print(f"Payment data created: {payment_data}")
        
        response_data = {
            'message': 'Payment gateway initialized successfully',
            'booking_reference': booking_reference,
            'payment_data': payment_data
        }
        
        print(f"Returning response: {response_data}")
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Error in book_event: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to initialize payment', 'details': str(e)}), 400

@bp.route('/user/bookings/<int:booking_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_booking(booking_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'user':
        return jsonify({'error': 'Not authorized'}), 403
    
    booking = Booking.query.get(booking_id)
    if not booking or booking.user_id != user_id:
        return jsonify({'error': 'Booking not found'}), 404
    
    if booking.status in ['cancelled', 'rejected']:
        return jsonify({'error': 'Booking is already cancelled or rejected'}), 400
    
    try:
        booking.status = 'cancelled'
        booking.cancelled_at = datetime.utcnow()
        
        # Update event participant count
        event = Event.query.get(booking.event_id)
        if event:
            event.current_participants = max(0, event.current_participants - 1)
        
        db.session.commit()
        return jsonify({'message': 'Booking cancelled successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel booking', 'details': str(e)}), 400

@bp.route('/user/events/<int:event_id>/confirm-booking', methods=['POST'])
@jwt_required()
def confirm_booking(event_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'user':
        return jsonify({'error': 'Not authorized'}), 403
    
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    data = request.get_json()
    booking_reference = data.get('booking_reference')
    payment_id = data.get('payment_id')
    notes = data.get('notes', '')
    
    if not booking_reference or not payment_id:
        return jsonify({'error': 'Missing booking reference or payment ID'}), 400
    
    # Check if user already has a booking for this event
    existing_booking = Booking.query.filter_by(user_id=user_id, event_id=event_id).first()
    if existing_booking:
        return jsonify({'error': 'You already have a booking for this event'}), 400
    
    try:
        # Create the actual booking
        booking = Booking()
        booking.user_id = user_id
        booking.event_id = event_id
        booking.booking_reference = booking_reference
        booking.status = 'confirmed'
        booking.payment_status = 'completed'
        booking.payment_id = payment_id
        booking.notes = notes
        
        db.session.add(booking)
        
        # Update event participant count
        event.current_participants += 1
        
        # Commit the booking first to get the booking.id
        db.session.commit()
        
        # Now create transaction record with the booking.id
        transaction = Transaction()
        transaction.booking_id = booking.id
        transaction.payment_id = payment_id
        transaction.amount = float(event.price)
        transaction.currency = event.currency
        transaction.status = 'completed'
        transaction.payment_method = 'razorpay'
        db.session.add(transaction)
        
        # Commit the transaction
        db.session.commit()
        
        # Notify CRM
        notify_crm_booking_confirmed(booking)
        
        return jsonify({
            'message': 'Booking confirmed successfully',
            'booking_id': booking.id,
            'booking_reference': booking.booking_reference
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in confirm_booking: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to confirm booking', 'details': str(e)}), 400

@bp.route('/razorpay/webhook', methods=['POST'])
def razorpay_webhook():
    """Handle Razorpay webhook notifications"""
    try:
        data = request.get_json()
        
        # Verify webhook signature (in production, you should verify the signature)
        # For now, we'll just process the notification
        
        if data.get('event') == 'payment.captured':
            payment_id = data.get('payload', {}).get('payment', {}).get('entity', {}).get('id')
            booking_reference = data.get('payload', {}).get('payment', {}).get('entity', {}).get('notes', {}).get('booking_reference')
            
            if payment_id and booking_reference:
                # Find booking by reference
                booking = Booking.query.filter_by(booking_reference=booking_reference).first()
                if booking:
                    # Update booking status if not already confirmed
                    if booking.status != 'confirmed':
                        booking.status = 'confirmed'
                        booking.payment_status = 'completed'
                        
                        # Create transaction record if not exists
                        existing_transaction = Transaction.query.filter_by(booking_id=booking.id, payment_id=payment_id).first()
                        if not existing_transaction:
                            transaction = Transaction()
                            transaction.booking_id = booking.id
                            transaction.payment_id = payment_id
                            transaction.amount = float(booking.event.price)
                            transaction.currency = booking.event.currency
                            transaction.status = 'completed'
                            transaction.payment_method = 'razorpay'
                            db.session.add(transaction)
                        
                        db.session.commit()
                        
                        # Notify CRM
                        notify_crm_booking_confirmed(booking)
        
        return jsonify({'status': 'success'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Webhook processing failed', 'details': str(e)}), 400



def create_razorpay_payment_for_event(event, booking_reference, user_id, notes):
    """Create Razorpay payment for a specific event"""
    try:
        # Razorpay configuration
        RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', 'your_razorpay_key_id')
        RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', 'your_razorpay_key_secret')
        
        print(f"Razorpay Key ID: {RAZORPAY_KEY_ID}")
        print(f"Razorpay Key Secret: {RAZORPAY_KEY_SECRET[:10]}..." if RAZORPAY_KEY_SECRET else "Not set")
        print(f"All environment variables: {dict(os.environ)}")
        
        # Check if credentials are properly set
        if RAZORPAY_KEY_ID == 'your_razorpay_key_id' or RAZORPAY_KEY_SECRET == 'your_razorpay_key_secret':
            print("Razorpay credentials not properly configured")
            return None
        
        # Initialize Razorpay client
        client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        
        # Create payment order
        amount_in_paise = int(float(event.price) * 100)  # Razorpay expects amount in paise
        print(f"Event price: {event.price}, Amount in paise: {amount_in_paise}")
        
        payment_data = {
            "amount": amount_in_paise,
            "currency": event.currency,
            "receipt": booking_reference,
            "notes": {
                "booking_reference": booking_reference,
                "event_id": str(event.id),
                "user_id": str(user_id)
            }
        }
        
        print(f"Creating Razorpay order with data: {payment_data}")
        
        try:
            order = client.order.create(data=payment_data)
            print(f"Razorpay order created: {order}")
        except Exception as order_error:
            print(f"Failed to create Razorpay order: {order_error}")
            print(f"Error type: {type(order_error)}")
            print(f"Error details: {str(order_error)}")
            print(f"Full error: {repr(order_error)}")
            return None
        
        return {
            'order_id': order['id'],
            'amount': order['amount'],
            'currency': order['currency'],
            'key_id': RAZORPAY_KEY_ID
        }
        
    except Exception as e:
        print(f"Razorpay payment creation failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def notify_crm_booking_confirmed(booking):
    """Notify CRM about confirmed booking"""
    try:
        CRM_URL = os.getenv('CRM_URL', 'http://crm-service:5001/notify')
        CRM_BEARER_TOKEN = os.getenv('CRM_BEARER_TOKEN', 'super-crm-token')
        
        event = Event.query.get(booking.event_id)
        user = User.query.get(booking.user_id)
        facilitator = User.query.get(event.user_id) if event else None
        
        payload = {
            'booking_id': booking.id,
            'facilitator_id': facilitator.id if facilitator else None,
            'action': 'payment_completed',
            'user': {
                'id': user.id if user else None,
                'name': user.name if user else None,
                'email': user.email if user else None
            } if user else None,
            'event': {
                'id': event.id if event else None,
                'title': event.title if event else None
            } if event else None,
            'facilitator': {
                'id': facilitator.id if facilitator else None,
                'name': facilitator.name if facilitator else None,
                'email': facilitator.email if facilitator else None
            } if facilitator else None,
            'status': booking.status,
            'payment_status': booking.payment_status
        }
        
        headers = {'Authorization': f'Bearer {CRM_BEARER_TOKEN}'}
        requests.post(CRM_URL, json=payload, headers=headers, timeout=3)
        
    except Exception as e:
        print(f'Failed to notify CRM: {e}') 