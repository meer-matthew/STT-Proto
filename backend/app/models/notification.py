from datetime import datetime
from app import db


class Notification(db.Model):
    """Notification model for user notifications"""
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False)  # e.g., 'conversation_added', 'participant_added', etc.
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=True, index=True)
    is_read = db.Column(db.Boolean, nullable=False, default=False, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    read_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    user = db.relationship('User', backref='notifications')
    conversation = db.relationship('Conversation', backref='notifications')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'conversation_id': self.conversation_id,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat(),
            'read_at': self.read_at.isoformat() if self.read_at else None
        }

    def __repr__(self):
        return f'<Notification id={self.id} user_id={self.user_id} type={self.type}>'
