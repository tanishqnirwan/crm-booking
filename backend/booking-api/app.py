# pylint: skip-file
# pyright: reportGeneralTypeIssues=false
from flask import Flask, request, jsonify, redirect, url_for, session
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Facilitator, Event, Booking, CRMNotification
from authlib.integrations.flask_client import OAuth
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Configure database URI (using PostgreSQL for Docker)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@db:5432/booking')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
app.secret_key = os.getenv('FLASK_SECRET_KEY')
print('FLASK_SECRET_KEY:', app.secret_key)

# Google OAuth config
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', 'your-google-client-id')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', 'your-google-client-secret')
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

jwt = JWTManager(app)
db.init_app(app)
oauth = OAuth(app)

google = oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url=GOOGLE_DISCOVERY_URL,
    client_kwargs={
        'scope': 'openid email profile'
    }
)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    name = data.get('name')
    password = data.get('password')
    if not email or not name or not password:
        return jsonify({'error': 'Missing required fields'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409
    password_hash = generate_password_hash(password)
    user = User(email=email, name=name, password_hash=password_hash, role='user', is_verified=True)  # type: ignore
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/register_facilitator', methods=['POST'])
def register_facilitator():
    data = request.get_json()
    email = data.get('email')
    name = data.get('name')
    password = data.get('password')
    bio = data.get('bio')
    specialization = data.get('specialization')
    profile_picture = data.get('profile_picture')
    if not email or not name or not password:
        return jsonify({'error': 'Missing required fields'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409
    password_hash = generate_password_hash(password)
    user = User(email=email, name=name, password_hash=password_hash, role='facilitator', is_verified=True)  # type: ignore
    db.session.add(user)
    db.session.commit()
    facilitator = Facilitator(user_id=user.id, name=name, email=email, bio=bio, specialization=specialization, profile_picture=profile_picture)  # type: ignore
    db.session.add(facilitator)
    db.session.commit()
    return jsonify({'message': 'Facilitator registered successfully', 'user_id': user.id, 'facilitator_id': facilitator.id}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400
    user = User.query.filter_by(email=email).first()
    if not user or not user.password_hash or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401
    access_token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': access_token, 'user': {'id': user.id, 'email': user.email, 'name': user.name}})

@app.route('/login/google')
def login_google():
    redirect_uri = url_for('auth_google_callback', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/auth/google/callback')
def auth_google_callback():
    try:
        token = google.authorize_access_token()
        userinfo = google.userinfo()
    except Exception as e:
        return jsonify({'error': 'Google login failed', 'details': str(e)}), 400
    if not userinfo or 'email' not in userinfo:
        return jsonify({'error': 'Failed to get user info from Google'}), 400
    # Find or create user
    user = User.query.filter_by(email=userinfo['email']).first()
    if not user:
        user = User(
            email=userinfo['email'],
            name=userinfo.get('name', userinfo['email']),
            google_id=userinfo.get('sub'),
            profile_picture=userinfo.get('picture'),
            is_verified=True,
            role='user'
        )  # type: ignore
        db.session.add(user)
        db.session.commit()
    # Issue JWT
    access_token = create_access_token(identity=str(user.id))
    # Optionally, redirect to frontend with token or return as JSON
    return jsonify({'access_token': access_token, 'user': {'id': user.id, 'email': user.email, 'name': user.name}})

@app.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'id': user.id, 'email': user.email, 'name': user.name, 'role': user.role})

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


