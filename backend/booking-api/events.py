from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Event, User
from extensions import db
from datetime import datetime

bp = Blueprint('events', __name__)

@bp.route('/events', methods=['GET'])
@jwt_required()
def list_events():
    events = Event.query.filter_by(is_active=True).all()
    result = []
    for event in events:
        user = User.query.get(event.user_id)
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
            'facilitator': {
                'id': user.id if user else None,
                'name': user.name if user else None,
                'email': user.email if user else None
            } if user else None
        })
    return jsonify(result)

@bp.route('/events', methods=['POST'])
@jwt_required()
def create_event():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'facilitator':
        return jsonify({'error': 'Only facilitators can create events'}), 403
    data = request.get_json()
    try:
        event = Event(
            title=data['title'],
            description=data.get('description'),
            event_type=data['event_type'],
            start_datetime=datetime.fromisoformat(data['start_datetime']),
            end_datetime=datetime.fromisoformat(data['end_datetime']),
            location=data.get('location'),
            virtual_link=data.get('virtual_link'),
            max_participants=data.get('max_participants', 1),
            price=data.get('price', 0.0),
            currency=data.get('currency', 'USD'),
            user_id=user.id
        )  # type: ignore
        db.session.add(event)
        db.session.commit()
        return jsonify({'message': 'Event created successfully', 'event_id': event.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create event', 'details': str(e)}), 400 