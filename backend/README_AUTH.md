# Authentication API Documentation

## Overview

The Wakaku STT backend now includes a secure authentication system for user login. This uses JWT (JSON Web Tokens) for stateless authentication and password hashing for security.

## Features

- ✅ Secure password hashing with Werkzeug
- ✅ JWT-based authentication (stateless)
- ✅ Token expiration (configurable, default 24 hours)
- ✅ Login for existing users only
- ✅ Protected route decorator
- ✅ Token verification endpoint
- ✅ Last login tracking

## Setup

### 1. Database Migration

Add password fields to the users table:

```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\activate on Windows

# Option 1: Using Flask-Migrate
flask db upgrade

# Option 2: Manual SQL (if needed)
# The migration file is in migrations/versions/add_password_fields.py
```

### 2. Set JWT Secret

Add to your `.env` file:

```env
JWT_SECRET=your-very-secret-jwt-key-here
JWT_EXPIRATION_HOURS=24
```

### 3. Install Required Packages

```bash
pip install PyJWT
```

## API Endpoints

### 1. Login

**POST** `/api/auth/login`

Login an existing user and receive a JWT token.

#### Request Body

```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

#### Success Response (200)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00.000000",
    "updated_at": "2024-01-01T00:00:00.000000",
    "is_active": true,
    "last_login": "2024-01-15T10:30:00.000000"
  },
  "expires_in": 86400
}
```

#### Error Responses

```json
// 400 - Missing fields
{
  "error": "Username and password are required"
}

// 401 - Invalid credentials
{
  "error": "Invalid username or password"
}

// 401 - Inactive account
{
  "error": "Account is inactive"
}
```

### 2. Verify Token

**GET** `/api/auth/verify`

Verify if the current token is valid.

#### Headers

```
Authorization: Bearer <token>
```

#### Success Response (200)

```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00.000000",
    "updated_at": "2024-01-01T00:00:00.000000",
    "is_active": true
  }
}
```

#### Error Responses

```json
// 401 - Missing token
{
  "error": "Token is missing"
}

// 401 - Expired token
{
  "error": "Token has expired"
}

// 401 - Invalid token
{
  "error": "Invalid token"
}
```

### 3. Get Current User

**GET** `/api/auth/me`

Get information about the currently authenticated user.

#### Headers

```
Authorization: Bearer <token>
```

#### Success Response (200)

```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00.000000",
    "updated_at": "2024-01-01T00:00:00.000000",
    "is_active": true,
    "last_login": "2024-01-15T10:30:00.000000"
  }
}
```

### 4. Logout

**POST** `/api/auth/logout`

Logout the current user (client-side token deletion).

#### Headers

```
Authorization: Bearer <token>
```

#### Success Response (200)

```json
{
  "message": "Logged out successfully"
}
```

## Creating Test Users

### Using Python Shell

```python
from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    # Create a new user
    user = User(username='testuser', email='test@example.com')
    user.set_password('password123')  # Hash the password
    
    db.session.add(user)
    db.session.commit()
    
    print(f"Created user: {user.username}")
```

### Using SQL Directly

```sql
-- First, hash a password using Python
-- In Python: from werkzeug.security import generate_password_hash
-- password_hash = generate_password_hash('your_password')

INSERT INTO users (username, email, password_hash, created_at, updated_at, is_active)
VALUES ('testuser', 'test@example.com', 'scrypt:...[hashed_password]', datetime('now'), datetime('now'), 1);
```

## Using Protected Routes

### In Your Route Files

```python
from app.routes.auth import token_required

@bp.route('/protected', methods=['GET'])
@token_required
def protected_route(current_user):
    """
    This route requires authentication
    current_user is automatically passed as the first argument
    """
    return jsonify({
        'message': f'Hello, {current_user.username}!',
        'user_id': current_user.id
    }), 200
```

## Client-Side Integration (React Native)

### Login Example

```javascript
const login = async (username, password) => {
  try {
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store token securely
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

### Using Token in Requests

```javascript
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = await AsyncStorage.getItem('authToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    // Token expired, redirect to login
    await AsyncStorage.removeItem('authToken');
    // Navigate to login screen
  }

  return response;
};
```

### Logout Example

```javascript
const logout = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    
    await fetch('http://localhost:5001/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Clear stored data
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    
    // Navigate to login screen
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

## Security Best Practices

1. **Always use HTTPS in production** - Never send tokens over unencrypted connections
2. **Store tokens securely** - Use AsyncStorage or SecureStore in React Native
3. **Implement token refresh** - Consider adding refresh tokens for better security
4. **Set strong JWT secrets** - Use long, random strings for JWT_SECRET
5. **Validate inputs** - Check for SQL injection, XSS, etc.
6. **Rate limit login attempts** - Prevent brute force attacks
7. **Use secure password policies** - Enforce minimum length, complexity
8. **Log security events** - Track failed login attempts, token misuse

## Testing

### Test Login with curl

```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'

# Verify token (replace <token> with actual token)
curl -X GET http://localhost:5001/api/auth/verify \
  -H "Authorization: Bearer <token>"

# Get current user
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer <token>"
```

## Troubleshooting

### "Invalid username or password"
- Check if user exists in database
- Verify password was set using `user.set_password()`
- Check if account is active (`is_active = True`)

### "Token has expired"
- Token expired after configured time (default 24 hours)
- User needs to login again

### "ModuleNotFoundError: No module named 'jwt'"
- Install PyJWT: `pip install PyJWT`

### Password not hashing
- Make sure to use `user.set_password()` method, not direct assignment
- Werkzeug should be installed (comes with Flask)

## Future Enhancements

- [ ] Add refresh tokens
- [ ] Implement password reset via email
- [ ] Add OAuth2 support (Google, Facebook)
- [ ] Implement rate limiting
- [ ] Add two-factor authentication (2FA)
- [ ] Token blacklisting for logout
- [ ] Account lockout after failed attempts
