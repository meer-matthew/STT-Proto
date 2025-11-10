from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=True, index=True)
    password_hash = db.Column(db.String(255), nullable=True)
    user_type = db.Column(db.String(20), nullable=False, default='user')  # 'user' or 'caretaker'
    gender = db.Column(db.String(20), nullable=True)  # 'male', 'female', or 'other'
    img_url = db.Column(db.String(500), nullable=True)  # URL to user's avatar image
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)

    # Relationships
    roles = db.relationship('UserRole', back_populates='user', cascade='all, delete-orphan')
    conversations = db.relationship('Conversation', back_populates='user', cascade='all, delete-orphan')

    def set_password(self, password):
        """Hash and set the user's password"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify the user's password"""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def get_avatar_url(self):
        """Get avatar URL - use provided img_url or generate from Dicebear API"""
        if self.img_url:
            return self.img_url
        # Generate avatar from Dicebear API using username as seed for consistency
        return f"https://api.dicebear.com/7.x/avataaars/svg?seed={self.username}"

    def to_dict(self, include_email=False):
        result = {
            'id': self.id,
            'username': self.username,
            'user_type': self.user_type,
            'gender': self.gender,
            'img_url': self.get_avatar_url(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_active': self.is_active
        }
        if include_email:
            result['email'] = self.email
        if self.last_login:
            result['last_login'] = self.last_login.isoformat()
        return result

    def __repr__(self):
        return f'<User {self.username}>'
