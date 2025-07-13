from flask import Blueprint, request, jsonify, url_for, redirect
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db, jwt, oauth
from models import User
from datetime import datetime
import os
import json
from urllib.parse import urlencode

bp = Blueprint('auth', __name__)

google = oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID', 'your-google-client-id'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET', 'your-google-client-secret'),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={'scope': 'openid email profile'}
)

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    name = data.get('name')
    password = data.get('password')
    role = data.get('role', 'user')
    if not email or not name or not password:
        return jsonify({'error': 'Missing required fields'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409
    password_hash = generate_password_hash(password)
    user = User(email=email, name=name, password_hash=password_hash, role=role, is_verified=True)  # type: ignore
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

@bp.route('/login', methods=['POST'])
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

@bp.route('/login/google')
def login_google():
    redirect_uri = url_for('auth.auth_google_callback', _external=True)
    return google.authorize_redirect(redirect_uri)

@bp.route('/auth/google/callback')
def auth_google_callback():
    try:
        token = google.authorize_access_token()
        userinfo = google.userinfo()
    except Exception as e:
        return jsonify({'error': 'Google login failed', 'details': str(e)}), 400
    if not userinfo or 'email' not in userinfo:
        return jsonify({'error': 'Failed to get user info from Google'}), 400
    user = User.query.filter_by(email=userinfo['email']).first()
    is_new = False
    if not user:
        user = User(
            email=userinfo['email'], # type: ignore
            name=userinfo.get('name', userinfo['email']), # type: ignore
            google_id=userinfo.get('sub'), # type: ignore
            is_verified=True, # type: ignore
            role=None # type: ignore
        )  # type: ignore
        db.session.add(user)
        db.session.commit()
        is_new = True
    access_token = create_access_token(identity=str(user.id))
    import json
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    params = urlencode({
        'access_token': access_token,
        'user': json.dumps({'id': user.id, 'email': user.email, 'name': user.name, 'role': user.role})
    })
    # If user has no role, redirect to /choose-role for role selection and extra info
    if is_new or not user.role:
        return redirect(f"{FRONTEND_URL}/choose-role?{params}")
    return redirect(f"{FRONTEND_URL}/oauth-callback?{params}")

@bp.route('/choose-role', methods=['PUT'])
@jwt_required()
def choose_role():
    print('Headers:', dict(request.headers))
    print('Raw data:', request.data)
    print('JSON:', request.get_json())
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.get_json()
    role = data.get('role') if data else None
    if not role:
        return jsonify({'error': 'Role is required'}), 400
    user.role = role
    db.session.commit()
    return jsonify({'id': user.id, 'email': user.email, 'name': user.name, 'role': user.role}), 200

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'id': user.id, 
        'email': user.email, 
        'name': user.name, 
        'role': user.role,
        'phone': user.phone,
        'is_verified': user.is_verified,
        'created_at': user.created_at.isoformat() if user.created_at else None
    })

@bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.get_json()
    
    # Update allowed fields
    if 'name' in data and data['name']:
        user.name = data['name']
    
    if 'phone' in data:
        user.phone = data['phone']
    
    db.session.commit()
    return jsonify({
        'id': user.id, 
        'email': user.email, 
        'name': user.name, 
        'role': user.role,
        'phone': user.phone,
        'is_verified': user.is_verified,
        'created_at': user.created_at.isoformat() if user.created_at else None
    }), 200 