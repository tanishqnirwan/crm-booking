from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Booking, Event, User
from extensions import db
from datetime import datetime
import uuid
import os
import requests

bp = Blueprint('bookings', __name__)

CRM_URL = os.getenv('CRM_URL', 'http://crm-service:5001/notify')
CRM_BEARER_TOKEN = os.getenv('CRM_BEARER_TOKEN', 'super-crm-token')

@bp.route('/bookings', methods=['POST'])
@jwt_required()
def create_booking():
    user_id = get_jwt_identity()
    data = request.get_json()
    event_id = data.get('event_id')
    if not event_id:
        return jsonify({'error': 'event_id is required'}), 400
    event = Event.query.get(event_id)
    if not event or not event.is_active:
        return jsonify({'error': 'Event not found or inactive'}), 404
    if event.current_participants >= event.max_participants:
        return jsonify({'error': 'Event is fully booked'}), 400
    # Prevent double booking
    existing = Booking.query.filter_by(user_id=user_id, event_id=event_id).first()
    if existing:
        return jsonify({'error': 'You have already booked this event'}), 409
    booking = Booking(
        booking_reference=str(uuid.uuid4()),
        status='confirmed',
        payment_status='pending',
        user_id=user_id,
        event_id=event_id
    )  # type: ignore
    event.current_participants += 1
    db.session.add(booking)
    db.session.commit()
    # Notify CRM
    try:
        user = User.query.get(user_id)
        payload = {
            'booking_id': booking.id,
            'user': {'id': user.id, 'email': user.email, 'name': user.name},
            'event': {'id': event.id, 'title': event.title},
            'facilitator_id': event.facilitator_id
        }
        headers = {'Authorization': f'Bearer {CRM_BEARER_TOKEN}'}
        requests.post(CRM_URL, json=payload, headers=headers, timeout=3)
    except Exception as e:
        print('Failed to notify CRM:', e)
    return jsonify({'message': 'Booking successful', 'booking_id': booking.id}), 201

@bp.route('/bookings', methods=['GET'])
@jwt_required()
def get_bookings():
    user_id = get_jwt_identity()
    bookings = Booking.query.filter_by(user_id=user_id).order_by(Booking.created_at.desc()).all()
    result = []
    for booking in bookings:
        event = Event.query.get(booking.event_id)
        result.append({
            'booking_id': booking.id,
            'booking_reference': booking.booking_reference,
            'status': booking.status,
            'payment_status': booking.payment_status,
            'event': {
                'id': event.id if event else None,
                'title': event.title if event else None,
                'start_datetime': event.start_datetime.isoformat() if event and event.start_datetime else None,
                'end_datetime': event.end_datetime.isoformat() if event and event.end_datetime else None
            } if event else None,
            'created_at': booking.created_at.isoformat() if booking.created_at else None
        })
    return jsonify(result) 