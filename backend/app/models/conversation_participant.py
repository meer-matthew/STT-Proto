from datetime import datetime
from app import db


class ConversationParticipant(db.Model):
    """Association table for many-to-many relationship between users and conversations"""
    __tablename__ = 'conversation_participants'

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    added_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    added_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Who added this participant

    # Unique constraint to prevent duplicate participants
    __table_args__ = (
        db.UniqueConstraint('conversation_id', 'user_id', name='unique_conversation_participant'),
    )

    # Relationships
    conversation = db.relationship('Conversation', back_populates='participants')
    user = db.relationship('User', foreign_keys=[user_id], backref='conversation_memberships')
    adder = db.relationship('User', foreign_keys=[added_by])

    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'user_type': self.user.user_type if self.user else None,
            'added_at': self.added_at.isoformat(),
            'added_by': self.added_by
        }

    def __repr__(self):
        return f'<ConversationParticipant conversation_id={self.conversation_id} user_id={self.user_id}>'
