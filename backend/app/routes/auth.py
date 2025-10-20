from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
from functools import wraps
import jwt
import os

from app import db
from app.models.user import User

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# JWT configuration
JWT_SECRET = os.environ.get('JWT_SECRET', os.environ.get('SECRET_KEY', 'dev-jwt-secret'))
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24


def generate_token(user_id, username):
    """Generate a JWT token for authenticated user"""
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def token_required(f):
    """Decorator to protect routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode token
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            current_user = User.query.get(payload['user_id'])
            
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'Invalid or inactive user'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated


@bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user

    Request body:
    {
        "username": "user123",
        "email": "user@example.com",
        "password": "password123",
        "user_type": "user"  // or "caretaker"
    }

    Response:
    {
        "token": "jwt-token-string",
        "user": {user_object},
        "expires_in": 86400
    }
    """
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('user_type', 'user')

    # Validate input
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    # Validate user_type
    if user_type not in ['user', 'caretaker']:
        return jsonify({'error': 'Invalid user type. Must be "user" or "caretaker"'}), 400

    # Check if username already exists
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({'error': 'Username already exists'}), 409

    # Check if email already exists
    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        return jsonify({'error': 'Email already exists'}), 409

    # Create new user
    try:
        new_user = User(
            username=username,
            email=email,
            user_type=user_type,
            is_active=True
        )
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        # Generate token
        token = generate_token(new_user.id, new_user.username)

        return jsonify({
            'token': token,
            'user': new_user.to_dict(include_email=True),
            'expires_in': JWT_EXPIRATION_HOURS * 3600
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


@bp.route('/login', methods=['POST'])
def login():
    """
    Login existing user with username and password

    Request body:
    {
        "username": "user123",
        "password": "password123"
    }

    Response:
    {
        "token": "jwt-token-string",
        "user": {user_object},
        "expires_in": 86400
    }
    """
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    username = data.get('username')
    password = data.get('password')

    # Validate input
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    # Find user by username
    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({'error': 'Invalid username or password'}), 401

    # Check if user is active
    if not user.is_active:
        return jsonify({'error': 'Account is inactive'}), 401

    # Verify password
    if not user.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Generate token
    token = generate_token(user.id, user.username)
    
    return jsonify({
        'token': token,
        'user': user.to_dict(include_email=True),
        'expires_in': JWT_EXPIRATION_HOURS * 3600  # in seconds
    }), 200


@bp.route('/verify', methods=['GET'])
@token_required
def verify_token(current_user):
    """
    Verify if the current token is valid
    
    Headers:
    Authorization: Bearer <token>
    
    Response:
    {
        "valid": true,
        "user": {user_object}
    }
    """
    return jsonify({
        'valid': True,
        'user': current_user.to_dict(include_email=True)
    }), 200


@bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """
    Get current authenticated user information
    
    Headers:
    Authorization: Bearer <token>
    
    Response:
    {
        "user": {user_object}
    }
    """
    return jsonify({
        'user': current_user.to_dict(include_email=True)
    }), 200


@bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """
    Logout user (client should delete token)

    Headers:
    Authorization: Bearer <token>

    Response:
    {
        "message": "Logged out successfully"
    }
    """
    # In a stateless JWT system, logout is handled client-side by deleting the token
    # You could add token blacklisting here if needed
    return jsonify({
        'message': 'Logged out successfully'
    }), 200


@bp.route('/users', methods=['GET'])
@token_required
def get_users(current_user):
    """
    Get list of all users

    Headers:
    Authorization: Bearer <token>

    Query Parameters:
    - user_type: Filter by user type (optional: 'user' or 'caretaker')
    - include_self: Include current user in results (optional: 'true' or 'false', default: 'true')

    Response:
    {
        "users": [{user_object}, ...]
    }
    """
    try:
        # Get query parameters
        user_type_filter = request.args.get('user_type')
        include_self = request.args.get('include_self', 'true').lower() == 'true'

        # Build query for active users
        query = User.query.filter_by(is_active=True)

        # Filter by user type if specified
        if user_type_filter and user_type_filter in ['user', 'caretaker']:
            query = query.filter_by(user_type=user_type_filter)

        # Execute query
        users = query.all()

        # Exclude current user if requested
        if not include_self:
            users = [user for user in users if user.id != current_user.id]

        # Convert to dictionary format (without sensitive information)
        users_data = [user.to_dict() for user in users]

        return jsonify({
            'users': users_data
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch users: {str(e)}'}), 500
