# pylint: skip-file
# pyright: reportGeneralTypeIssues=false
from flask import Flask, jsonify
from flask_cors import CORS
from extensions import db, jwt, oauth
from models import User, Event, Booking, CRMNotification
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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)


