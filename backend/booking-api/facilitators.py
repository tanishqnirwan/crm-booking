from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Event, Booking, User
from extensions import db
from datetime import datetime

bp = Blueprint('facilitators', __name__)

def is_facilitator(user):
    return user and user.role == 'facilitator'

@bp.route('/facilitator/events', methods=['GET'])
@jwt_required()
def facilitator_events():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'facilitator':
        return jsonify({'error': 'Not authorized'}), 403
    events = Event.query.filter_by(user_id=user_id).all()
    result = []
    for event in events:
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
            'is_active': event.is_active
        })
    return jsonify(result)

@bp.route('/facilitator/events/<int:event_id>/bookings', methods=['GET'])
@jwt_required()
def event_bookings(event_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    event = Event.query.get(event_id)
    if not user or user.role != 'facilitator' or not event or event.user_id != user_id:
        return jsonify({'error': 'Not authorized or event not found'}), 403
    bookings = Booking.query.filter_by(event_id=event_id).all()
    result = []
    for booking in bookings:
        booking_user = User.query.get(booking.user_id)
        result.append({
            'booking_id': booking.id,
            'user': {
                'id': booking_user.id if booking_user else None,
                'name': booking_user.name if booking_user else None,
                'email': booking_user.email if booking_user else None
            } if booking_user else None,
            'status': booking.status,
            'created_at': booking.created_at.isoformat() if booking.created_at else None
        })
    return jsonify(result)

@bp.route('/events/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    event = Event.query.get(event_id)
    if not user or user.role != 'facilitator' or not event or event.user_id != user_id:
        return jsonify({'error': 'Not authorized or event not found'}), 403
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

@bp.route('/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def cancel_event(event_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    event = Event.query.get(event_id)
    if not user or user.role != 'facilitator' or not event or event.user_id != user_id:
        return jsonify({'error': 'Not authorized or event not found'}), 403
    try:
        event.is_active = False
        db.session.commit()
        return jsonify({'message': 'Event cancelled successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel event', 'details': str(e)}), 400 