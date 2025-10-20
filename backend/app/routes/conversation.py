from flask import Blueprint, request, jsonify, Response, stream_with_context
from datetime import datetime
import uuid
import json
import time
from functools import wraps
from app import db
from app.models.conversation import Conversation, Message
from app.models.conversation_participant import ConversationParticipant
from app.models.user import User
from app.routes.auth import token_required

bp = Blueprint('conversation', __name__, url_prefix='/api')


def has_conversation_access(user_id, conversation_id):
    """Check if user has access to conversation (owner or participant)"""
    conversation = Conversation.query.get(conversation_id)
    if not conversation or not conversation.is_active:
        return False, None

    # Check if user is owner
    if conversation.user_id == user_id:
        return True, conversation

    # Check if user is participant
    participant = ConversationParticipant.query.filter_by(
        conversation_id=conversation_id,
        user_id=user_id
    ).first()

    if participant:
        return True, conversation

    return False, None


@bp.route('/conversations', methods=['GET'])
@token_required
def get_user_conversations(current_user):
    """Get all conversations for the current user (owned or participating)"""
    try:
        # Get conversations owned by user
        owned_conversations = Conversation.query.filter_by(
            user_id=current_user.id,
            is_active=True
        ).all()

        # Get conversations where user is a participant
        participant_records = ConversationParticipant.query.filter_by(
            user_id=current_user.id
        ).all()
        participant_conv_ids = [p.conversation_id for p in participant_records]

        participating_conversations = Conversation.query.filter(
            Conversation.id.in_(participant_conv_ids),
            Conversation.is_active == True
        ).all() if participant_conv_ids else []

        # Combine and deduplicate
        all_conversations = list({conv.id: conv for conv in owned_conversations + participating_conversations}.values())

        # Sort by updated_at
        all_conversations.sort(key=lambda x: x.updated_at, reverse=True)

        return jsonify({
            'conversations': [conv.to_dict() for conv in all_conversations]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/conversations', methods=['POST'])
@token_required
def create_conversation(current_user):
    """Create a new conversation for the current user"""
    try:
        data = request.get_json()
        configuration = data.get('configuration', '1:1')

        # Create new conversation
        conversation = Conversation(
            user_id=current_user.id,
            configuration=configuration,
            is_active=True
        )

        db.session.add(conversation)
        db.session.commit()

        return jsonify(conversation.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/conversations/<int:conversation_id>', methods=['GET'])
@token_required
def get_conversation(current_user, conversation_id):
    """Get conversation details - for owner or participants"""
    try:
        has_access, conversation = has_conversation_access(current_user.id, conversation_id)

        if not has_access:
            return jsonify({'error': 'Conversation not found'}), 404

        return jsonify(conversation.to_dict(include_messages=True)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/conversations/<int:conversation_id>/messages', methods=['POST'])
@token_required
def send_message(current_user, conversation_id):
    """Send a message in a conversation - for owner or participants"""
    try:
        has_access, conversation = has_conversation_access(current_user.id, conversation_id)

        if not has_access:
            return jsonify({'error': 'Conversation not found'}), 404

        data = request.get_json()
        sender = data.get('sender', current_user.username)
        sender_type = data.get('sender_type', 'user')
        message_text = data.get('message')
        has_audio = data.get('has_audio', False)

        if not message_text:
            return jsonify({'error': 'message is required'}), 400

        # Create new message
        message = Message(
            conversation_id=conversation_id,
            sender=sender,
            sender_type=sender_type,
            message=message_text,
            has_audio=has_audio
        )

        db.session.add(message)
        conversation.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify(message.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/conversations/<int:conversation_id>/messages', methods=['GET'])
@token_required
def get_messages(current_user, conversation_id):
    """Get all messages in a conversation - for owner or participants"""
    try:
        has_access, conversation = has_conversation_access(current_user.id, conversation_id)

        if not has_access:
            return jsonify({'error': 'Conversation not found'}), 404

        messages = Message.query.filter_by(
            conversation_id=conversation_id
        ).order_by(Message.created_at).all()

        return jsonify({
            'messages': [msg.to_dict() for msg in messages]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/speech-to-text', methods=['POST'])
def speech_to_text():
    """Process audio file and convert to text (placeholder)"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']

    # TODO: Implement actual speech-to-text processing
    # For now, return a placeholder response

    return jsonify({
        'transcript': 'Audio processing coming soon',
        'confidence': 0.0
    }), 200

@bp.route('/text-to-speech', methods=['POST'])
def text_to_speech():
    """Convert text to speech (placeholder)"""
    data = request.get_json()
    text = data.get('text')

    if not text:
        return jsonify({'error': 'text is required'}), 400

    return jsonify({
        'audio_url': None,
        'message': 'Text-to-speech processing coming soon'
    }), 200

@bp.route('/conversations/<int:conversation_id>/messages/stream', methods=['POST'])
@token_required
def stream_message(current_user, conversation_id):
    """Stream a conversation message in real-time using Server-Sent Events - for owner or participants"""
    # Verify user has access to conversation
    has_access, conversation = has_conversation_access(current_user.id, conversation_id)

    if not has_access:
        return jsonify({'error': 'Conversation not found'}), 404

    data = request.get_json()
    message_text = data.get('message')
    sender = data.get('sender', current_user.username)
    sender_type = data.get('sender_type', 'user')
    has_audio = data.get('has_audio', False)

    if not message_text:
        return jsonify({'error': 'message is required'}), 400

    def stream_conversation_message():
        """Generator function that streams the conversation message"""
        # Create the message in database
        message = Message(
            conversation_id=conversation_id,
            sender=sender,
            sender_type=sender_type,
            message=message_text,
            has_audio=has_audio
        )
        db.session.add(message)
        conversation.updated_at = datetime.utcnow()
        db.session.commit()

        message_id = message.id

        # Send initial metadata
        yield f"data: {json.dumps({'type': 'start', 'message_id': message_id})}\n\n"

        # Stream the message in chunks (simulate streaming for consistency)
        words = message_text.split()
        accumulated_text = ""

        for i, word in enumerate(words):
            accumulated_text += word + (" " if i < len(words) - 1 else "")
            chunk_data = {
                'type': 'chunk',
                'message_id': message_id,
                'text': word + (" " if i < len(words) - 1 else ""),
                'accumulated_text': accumulated_text
            }
            yield f"data: {json.dumps(chunk_data)}\n\n"
            # Small delay to simulate streaming
            time.sleep(0.05)

        # Send completion event
        complete_data = {
            'type': 'complete',
            'message_id': message_id,
            'message': message.to_dict()
        }
        yield f"data: {json.dumps(complete_data)}\n\n"
        yield "data: [DONE]\n\n"

    return Response(
        stream_with_context(stream_conversation_message()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive'
        }
    )


@bp.route('/conversations/<int:conversation_id>/participants', methods=['GET'])
@token_required
def get_participants(current_user, conversation_id):
    """
    Get all participants in a conversation

    Accessible by both owner and participants
    """
    try:
        # Check if user has access to conversation (owner or participant)
        has_access, conversation = has_conversation_access(current_user.id, conversation_id)

        if not has_access:
            return jsonify({'error': 'Conversation not found'}), 404

        participants = ConversationParticipant.query.filter_by(
            conversation_id=conversation_id
        ).all()

        return jsonify({
            'participants': [p.to_dict() for p in participants]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/conversations/<int:conversation_id>/participants', methods=['POST'])
@token_required
def add_participant(current_user, conversation_id):
    """
    Add a participant to a conversation

    Only the owner can add participants

    Request body:
    {
        "user_id": 2
    }
    """
    try:
        conversation = Conversation.query.filter_by(
            id=conversation_id,
            user_id=current_user.id
        ).first()

        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404

        data = request.get_json()
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        # Check if user exists
        user = User.query.get(user_id)
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 404

        # Check if already a participant
        existing = ConversationParticipant.query.filter_by(
            conversation_id=conversation_id,
            user_id=user_id
        ).first()

        if existing:
            return jsonify({'error': 'User is already a participant'}), 409

        # Add participant
        participant = ConversationParticipant(
            conversation_id=conversation_id,
            user_id=user_id,
            added_by=current_user.id
        )

        db.session.add(participant)
        db.session.commit()

        return jsonify(participant.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/conversations/<int:conversation_id>/participants/<int:user_id>', methods=['DELETE'])
@token_required
def remove_participant(current_user, conversation_id, user_id):
    """
    Remove a participant from a conversation

    Only the owner can remove participants
    """
    try:
        conversation = Conversation.query.filter_by(
            id=conversation_id,
            user_id=current_user.id
        ).first()

        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404

        # Find participant
        participant = ConversationParticipant.query.filter_by(
            conversation_id=conversation_id,
            user_id=user_id
        ).first()

        if not participant:
            return jsonify({'error': 'Participant not found'}), 404

        db.session.delete(participant)
        db.session.commit()

        return jsonify({'message': 'Participant removed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
