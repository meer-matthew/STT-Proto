from datetime import datetime
from app import db

class Conversation(db.Model):
    __tablename__ = 'conversations'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    configuration = db.Column(db.String(20), nullable=False)  # e.g., "1:1", "2:1", etc.
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='conversations')
    messages = db.relationship('Message', back_populates='conversation', cascade='all, delete-orphan', order_by='Message.created_at')
    participants = db.relationship('ConversationParticipant', back_populates='conversation', cascade='all, delete-orphan')

    def to_dict(self, include_messages=False, include_participants=False):
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'configuration': self.configuration,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'is_active': self.is_active,
            'message_count': len(self.messages) if self.messages else 0
        }

        if include_messages:
            result['messages'] = [msg.to_dict() for msg in self.messages]

        if include_participants:
            result['participants'] = [p.to_dict() for p in self.participants]
            result['participant_count'] = len(self.participants)

        return result

    def is_participant(self, user_id):
        """Check if a user is a participant in this conversation"""
        return any(p.user_id == user_id for p in self.participants)

    def __repr__(self):
        return f'<Conversation id={self.id} user_id={self.user_id} config={self.configuration}>'


class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=False, index=True)
    sender = db.Column(db.String(80), nullable=False)
    sender_type = db.Column(db.String(20), nullable=False)  # 'user' or 'caregiver'
    sender_gender = db.Column(db.String(20), nullable=True)  # 'male', 'female', or 'other' - for TTS voice selection
    message = db.Column(db.Text, nullable=False)
    has_audio = db.Column(db.Boolean, default=False, nullable=False)
    audio_url = db.Column(db.String(500), nullable=True)  # URL to stored audio file
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relationships
    conversation = db.relationship('Conversation', back_populates='messages')

    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender': self.sender,
            'sender_type': self.sender_type,
            'sender_gender': self.sender_gender,
            'message': self.message,
            'has_audio': self.has_audio,
            'audio_url': self.audio_url,
            'created_at': self.created_at.isoformat()
        }

    def __repr__(self):
        return f'<Message id={self.id} conversation_id={self.conversation_id} sender={self.sender}>'
