from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Event, Booking, User, CRMNotification
from extensions import db
from datetime import datetime
import requests
import os

bp = Blueprint('facilitators', __name__)

def is_facilitator(user):
    return user and user.role == 'facilitator'

@bp.route('/facilitator/dashboard', methods=['GET'])
@jwt_required()
def facilitator_dashboard():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'facilitator':
        return jsonify({'error': 'Not authorized'}), 403
    
    # Get facilitator's events
    events = Event.query.filter_by(user_id=user_id).all()
    total_events = len(events)
    active_events = len([e for e in events if e.is_active])
    
    # Get total bookings
    total_bookings = Booking.query.join(Event).filter(Event.user_id == user_id).count()
    
    # Get total revenue
    total_revenue = 0
    for event in events:
        bookings = Booking.query.filter_by(event_id=event.id, payment_status='completed').all()
        total_revenue += sum(float(event.price) for _ in bookings)
    
    # Get recent bookings
    recent_bookings = Booking.query.join(Event).filter(
        Event.user_id == user_id
    ).order_by(Booking.created_at.desc()).limit(5).all()
    
    recent_bookings_data = []
    for booking in recent_bookings:
        event = Event.query.get(booking.event_id)
        booking_user = User.query.get(booking.user_id)
        recent_bookings_data.append({
            'id': booking.id,
            'booking_reference': booking.booking_reference,
            'status': booking.status,
            'payment_status': booking.payment_status,
            'created_at': booking.created_at.isoformat() if booking.created_at else None,
            'event': {
                'id': event.id if event else None,
                'title': event.title if event else None,
                'price': float(event.price) if event else 0
            } if event else None,
            'user': {
                'id': booking_user.id if booking_user else None,
                'name': booking_user.name if booking_user else None,
                'email': booking_user.email if booking_user else None
            } if booking_user else None
        })
    
    return jsonify({
        'stats': {
            'total_events': total_events,
            'active_events': active_events,
            'total_bookings': total_bookings,
            'total_revenue': round(total_revenue, 2)
        },
        'recent_bookings': recent_bookings_data
    })

@bp.route('/facilitator/events', methods=['GET'])
@jwt_required()
def facilitator_events():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'facilitator':
        return jsonify({'error': 'Not authorized'}), 403
    events = Event.query.filter_by(user_id=user_id).order_by(Event.created_at.desc()).all()
    result = []
    for event in events:
        # Get booking count for this event
        booking_count = Booking.query.filter_by(event_id=event.id).count()
        result.append({
            'id': event.id,
            'title': event.title,
            'description': event.description,
            'event_type': event.event_type,
            'start_datetime': event.start_datetime.isoformat() if event.start_datetime else None,
            'end_datetime': event.end_datetime.isoformat() if event.end_datetime else None,
            'location': event.location,
            'virtual_link': event.virtual_link,
            'max_participants': event.max_participants,
            'current_participants': event.current_participants,
            'price': float(event.price),
            'currency': event.currency,
            'is_active': event.is_active,
            'booking_count': booking_count,
            'created_at': event.created_at.isoformat() if event.created_at else None
        })
    return jsonify(result)

@bp.route('/facilitator/events/<int:event_id>', methods=['GET'])
@jwt_required()
def get_event(event_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    event = Event.query.get(event_id)
    
    # Debug logging
    print(f"Debug - user_id from token: {user_id}, type: {type(user_id)}")
    print(f"Debug - user found: {user is not None}")
    if user:
        print(f"Debug - user role: {user.role}")
    print(f"Debug - event found: {event is not None}")
    if event:
        print(f"Debug - event.user_id: {event.user_id}, type: {type(event.user_id)}")
    
    # Check authorization
    if not user:
        return jsonify({'error': 'User not found'}), 403
    
    if user.role != 'facilitator':
        return jsonify({'error': 'Only facilitators can access this endpoint'}), 403
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Convert both IDs to int for comparison
    if int(event.user_id) != int(user_id):
        return jsonify({'error': 'Not authorized to access this event'}), 403
    
    return jsonify({
        'id': event.id,
        'title': event.title,
        'description': event.description,
        'event_type': event.event_type,
        'start_datetime': event.start_datetime.isoformat() if event.start_datetime else None,
        'end_datetime': event.end_datetime.isoformat() if event.end_datetime else None,
        'location': event.location,
        'virtual_link': event.virtual_link,
        'max_participants': event.max_participants,
        'current_participants': event.current_participants,
        'price': float(event.price),
        'currency': event.currency,
        'is_active': event.is_active,
        'created_at': event.created_at.isoformat() if event.created_at else None
    })

@bp.route('/facilitator/events/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    event = Event.query.get(event_id)
    
    # Check authorization
    if not user:
        return jsonify({'error': 'User not found'}), 403
    
    if user.role != 'facilitator':
        return jsonify({'error': 'Only facilitators can access this endpoint'}), 403
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Convert both IDs to int for comparison
    if int(event.user_id) != int(user_id):
        return jsonify({'error': 'Not authorized to access this event'}), 403
    
    data = request.get_json()
    try:
        for field in ['title', 'description', 'event_type', 'start_datetime', 'end_datetime', 'location', 'virtual_link', 'max_participants', 'price', 'currency']:
            if field in data:
                if field in ['start_datetime', 'end_datetime']:
                    setattr(event, field, datetime.fromisoformat(data[field]))
                else:
                    setattr(event, field, data[field])
        db.session.commit()
        return jsonify({'message': 'Event updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update event', 'details': str(e)}), 400

@bp.route('/facilitator/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    event = Event.query.get(event_id)
    
    # Check authorization
    if not user:
        return jsonify({'error': 'User not found'}), 403
    
    if user.role != 'facilitator':
        return jsonify({'error': 'Only facilitators can access this endpoint'}), 403
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Convert both IDs to int for comparison
    if int(event.user_id) != int(user_id):
        return jsonify({'error': 'Not authorized to access this event'}), 403
    
    try:
        # Cancel all bookings for this event
        bookings = Booking.query.filter_by(event_id=event_id).all()
        for booking in bookings:
            booking.status = 'cancelled'
            booking.cancelled_at = datetime.utcnow()
        
        # Delete the event
        db.session.delete(event)
        db.session.commit()
        return jsonify({'message': 'Event deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete event', 'details': str(e)}), 400

@bp.route('/facilitator/bookings', methods=['GET'])
@jwt_required()
def facilitator_bookings():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'facilitator':
        return jsonify({'error': 'Not authorized'}), 403
    
    bookings = Booking.query.join(Event).filter(
        Event.user_id == user_id
    ).order_by(Booking.created_at.desc()).all()
    
    result = []
    for booking in bookings:
        event = Event.query.get(booking.event_id)
        booking_user = User.query.get(booking.user_id)
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
                'price': float(event.price) if event else 0
            } if event else None,
            'user': {
                'id': booking_user.id if booking_user else None,
                'name': booking_user.name if booking_user else None,
                'email': booking_user.email if booking_user else None
            } if booking_user else None
        })
    return jsonify(result)

@bp.route('/facilitator/bookings/<int:booking_id>/approve', methods=['PUT'])
@jwt_required()
def approve_booking(booking_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    booking = Booking.query.get(booking_id)
    
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    event = Event.query.get(booking.event_id)
    
    # Check authorization
    if not user:
        return jsonify({'error': 'User not found'}), 403
    
    if user.role != 'facilitator':
        return jsonify({'error': 'Only facilitators can access this endpoint'}), 403
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Convert both IDs to int for comparison
    if int(event.user_id) != int(user_id):
        return jsonify({'error': 'Not authorized to access this event'}), 403
    
    try:
        booking.status = 'confirmed'
        booking.payment_status = 'completed'
        db.session.commit()
        
        # Notify CRM
        notify_crm(booking, 'approved')
        
        return jsonify({'message': 'Booking approved successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to approve booking', 'details': str(e)}), 400

@bp.route('/facilitator/bookings/<int:booking_id>/reject', methods=['PUT'])
@jwt_required()
def reject_booking(booking_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    booking = Booking.query.get(booking_id)
    
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    event = Event.query.get(booking.event_id)
    
    # Check authorization
    if not user:
        return jsonify({'error': 'User not found'}), 403
    
    if user.role != 'facilitator':
        return jsonify({'error': 'Only facilitators can access this endpoint'}), 403
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Convert both IDs to int for comparison
    if int(event.user_id) != int(user_id):
        return jsonify({'error': 'Not authorized to access this event'}), 403
    
    try:
        booking.status = 'rejected'
        booking.payment_status = 'refunded'
        db.session.commit()
        
        # Notify CRM
        notify_crm(booking, 'rejected')
        
        return jsonify({'message': 'Booking rejected successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to reject booking', 'details': str(e)}), 400

@bp.route('/facilitator/transactions', methods=['GET'])
@jwt_required()
def facilitator_transactions():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'facilitator':
        return jsonify({'error': 'Not authorized'}), 403
    
    # Get all completed bookings for facilitator's events
    bookings = Booking.query.join(Event).filter(
        Event.user_id == user_id,
        Booking.payment_status == 'completed'
    ).order_by(Booking.created_at.desc()).all()
    
    result = []
    total_revenue = 0
    for booking in bookings:
        event = Event.query.get(booking.event_id)
        booking_user = User.query.get(booking.user_id)
        revenue = float(event.price) if event else 0
        total_revenue += revenue
        
        result.append({
            'id': booking.id,
            'booking_reference': booking.booking_reference,
            'amount': revenue,
            'currency': event.currency if event else 'USD',
            'status': booking.status,
            'created_at': booking.created_at.isoformat() if booking.created_at else None,
            'event': {
                'id': event.id if event else None,
                'title': event.title if event else None
            } if event else None,
            'user': {
                'id': booking_user.id if booking_user else None,
                'name': booking_user.name if booking_user else None,
                'email': booking_user.email if booking_user else None
            } if booking_user else None
        })
    
    return jsonify({
        'transactions': result,
        'total_revenue': round(total_revenue, 2)
    })

def notify_crm(booking, action):
    """Notify CRM about booking status changes"""
    try:
        CRM_URL = os.getenv('CRM_URL', 'http://crm-service:5001/notify')
        CRM_BEARER_TOKEN = os.getenv('CRM_BEARER_TOKEN', 'super-crm-token')
        
        event = Event.query.get(booking.event_id)
        user = User.query.get(booking.user_id)
        facilitator = User.query.get(event.user_id)
        
        payload = {
            'booking_id': booking.id,
            'action': action,
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
        
        # Log notification
        notification = CRMNotification(
            booking_id=booking.id,
            status=f'facilitator_{action}',
            response='Notification sent successfully'
        )
        db.session.add(notification)
        db.session.commit()
        
    except Exception as e:
        print(f'Failed to notify CRM: {e}')
        # Log failed notification
        notification = CRMNotification(
            booking_id=booking.id,
            status=f'facilitator_{action}_failed',
            response=str(e)
        )
        db.session.add(notification)
        db.session.commit() 