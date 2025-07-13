# pylint: skip-file
# pyright: reportGeneralTypeIssues=false
from flask import Flask, jsonify
from flask_cors import CORS
from extensions import db, jwt, oauth
from models import User, Facilitator, Event, Booking, CRMNotification
from auth import bp as auth_bp
from events import bp as events_bp
from bookings import bp as bookings_bp
from facilitators import bp as facilitators_bp
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/booking')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
app.secret_key = os.getenv('FLASK_SECRET_KEY')

# Initialize extensions

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(events_bp)
app.register_blueprint(bookings_bp)
app.register_blueprint(facilitators_bp)

db.init_app(app)
jwt.init_app(app)
oauth.init_app(app)

@app.route('/')
def hello():
    return {'message': 'Booking System API is running!'}

@app.route('/health')
def health_check():
    return {'status': 'healthy', 'service': 'booking-api'}

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Insert sample data if tables are empty
        if not User.query.first():
            from werkzeug.security import generate_password_hash
            user = User(email='user@example.com', name='Test User', password_hash=generate_password_hash('test'), role='user', is_verified=True)  # type: ignore
            facilitator_user = User(email='facilitator@example.com', name='Facilitator User', password_hash=generate_password_hash('test'), role='facilitator', is_verified=True)  # type: ignore
            db.session.add_all([user, facilitator_user])
            db.session.commit()
            facilitator = Facilitator(user_id=facilitator_user.id, name='Jane Facilitator', email='facilitator@example.com', bio='Expert in wellness', specialization='Yoga')  # type: ignore
            db.session.add(facilitator)
            db.session.commit()
            event = Event(
                title='Morning Yoga',  # type: ignore
                description='A relaxing yoga session',  # type: ignore
                event_type='session',  # type: ignore
                start_datetime=datetime(2024, 7, 1, 8, 0, 0),  # type: ignore
                end_datetime=datetime(2024, 7, 1, 9, 0, 0),  # type: ignore
                location='Studio 1',  # type: ignore
                max_participants=10,  # type: ignore
                price=20.00,  # type: ignore
                facilitator_id=facilitator.id  # type: ignore
            )  # type: ignore
            db.session.add(event)
            db.session.commit()
    app.run(debug=True, host='0.0.0.0', port=5000)


