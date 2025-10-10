# Database Schema Documentation

## Overview

The STT (Speech-to-Text) application uses SQLite with SQLAlchemy ORM for data persistence.

Database file location: `backend/stt.db`

## Tables

### 1. Users Table (`users`)

Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | Primary Key | Unique user identifier |
| username | String(80) | Unique, Not Null, Indexed | User's username |
| email | String(120) | Unique, Nullable, Indexed | User's email address |
| created_at | DateTime | Not Null, Default: now() | Account creation timestamp |
| updated_at | DateTime | Not Null, Auto-update | Last update timestamp |
| is_active | Boolean | Not Null, Default: True | Account active status |

**Relationships:**
- One-to-Many with `user_roles`
- One-to-Many with `conversations`

---

### 2. Roles Table (`roles`)

Defines available user roles in the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | Primary Key | Unique role identifier |
| name | String(50) | Unique, Not Null, Indexed | Role name (e.g., 'user', 'caregiver', 'admin') |
| description | String(200) | Nullable | Role description |
| created_at | DateTime | Not Null, Default: now() | Role creation timestamp |

**Default Roles:**
- `user` - Regular user of the application
- `caregiver` - Caregiver assisting users
- `admin` - Administrator with full access

**Relationships:**
- One-to-Many with `user_roles`

---

### 3. User Roles Table (`user_roles`)

Junction table for many-to-many relationship between users and roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | Primary Key | Unique assignment identifier |
| user_id | Integer | Foreign Key (users.id), Not Null, Indexed | Reference to user |
| role_id | Integer | Foreign Key (roles.id), Not Null, Indexed | Reference to role |
| assigned_at | DateTime | Not Null, Default: now() | Role assignment timestamp |

**Constraints:**
- Unique constraint on (user_id, role_id) to prevent duplicate role assignments

**Relationships:**
- Many-to-One with `users`
- Many-to-One with `roles`

---

### 4. Conversations Table (`conversations`)

Stores conversation sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | Primary Key | Unique conversation identifier |
| user_id | Integer | Foreign Key (users.id), Not Null, Indexed | Reference to user who owns the conversation |
| configuration | String(20) | Not Null | Conversation configuration (e.g., "1:1", "2:1", "3:1") |
| created_at | DateTime | Not Null, Default: now() | Conversation creation timestamp |
| updated_at | DateTime | Not Null, Auto-update | Last update timestamp |
| is_active | Boolean | Not Null, Default: True | Conversation active status |

**Configuration Format:**
- Format: `{caregivers}:{users}` (e.g., "1:1", "2:1", "3:1", "1:2", "2:2")

**Relationships:**
- Many-to-One with `users`
- One-to-Many with `messages` (ordered by created_at)

---

### 5. Messages Table (`messages`)

Stores individual messages within conversations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | Primary Key | Unique message identifier |
| conversation_id | Integer | Foreign Key (conversations.id), Not Null, Indexed | Reference to conversation |
| sender | String(80) | Not Null | Name of the message sender |
| sender_type | String(20) | Not Null | Type of sender ('user' or 'caregiver') |
| message | Text | Not Null | Message content |
| has_audio | Boolean | Not Null, Default: False | Whether message was created via voice |
| audio_url | String(500) | Nullable | URL to stored audio file (if applicable) |
| created_at | DateTime | Not Null, Default: now(), Indexed | Message creation timestamp |

**Relationships:**
- Many-to-One with `conversations`

---

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Users     │────1:N──│  UserRoles   │──N:1────│   Roles     │
└─────────────┘         └──────────────┘         └─────────────┘
      │
      │ 1:N
      │
┌─────────────┐
│Conversations│
└─────────────┘
      │
      │ 1:N
      │
┌─────────────┐
│  Messages   │
└─────────────┘
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Initialize Database

The database is automatically created when the Flask app starts for the first time.

```bash
python run.py
```

### 3. Seed Sample Data (Optional)

```bash
python seed_data.py
```

This creates:
- 3 sample users (john_doe, jane_smith, alice_care)
- 3 roles (user, caregiver, admin)
- 2 sample conversations
- 3 sample messages

---

## Database Migrations

### Using Flask-Migrate

Initialize migrations (first time only):
```bash
export FLASK_APP=run.py
flask db init
```

Create a migration:
```bash
flask db migrate -m "Description of changes"
```

Apply migrations:
```bash
flask db upgrade
```

Rollback:
```bash
flask db downgrade
```

---

## Querying the Database

### Using SQLite CLI

```bash
sqlite3 stt.db

# View tables
.tables

# View schema
.schema users

# Query data
SELECT * FROM users;
SELECT * FROM conversations WHERE user_id = 1;
```

### Using Python Shell

```python
from app import create_app, db
from app.models import User, Conversation, Message

app = create_app()
with app.app_context():
    # Get all users
    users = User.query.all()

    # Get user by username
    user = User.query.filter_by(username='john_doe').first()

    # Get conversations for a user
    conversations = Conversation.query.filter_by(user_id=user.id).all()

    # Get messages in a conversation
    messages = Message.query.filter_by(conversation_id=1).order_by(Message.created_at).all()
```

---

## API Integration

See the conversation routes in `app/routes/conversation.py` for endpoints that interact with these models.

Key endpoints:
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/<id>` - Get conversation with messages
- `POST /api/conversations/<id>/messages` - Add message
- `GET /api/conversations/<id>/messages` - Get all messages
