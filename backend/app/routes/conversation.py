from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid

bp = Blueprint('conversation', __name__, url_prefix='/api')

# In-memory storage for demo (replace with database in production)
conversations = {}
messages = {}

@bp.route('/conversations', methods=['POST'])
def create_conversation():
    """Create a new conversation"""
    data = request.get_json()

    username = data.get('username')
    configuration = data.get('configuration')

    if not username or not configuration:
        return jsonify({'error': 'username and configuration are required'}), 400

    conversation_id = str(uuid.uuid4())
    conversations[conversation_id] = {
        'id': conversation_id,
        'username': username,
        'configuration': configuration,
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat()
    }
    messages[conversation_id] = []

    return jsonify(conversations[conversation_id]), 201

@bp.route('/conversations/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    """Get conversation details"""
    if conversation_id not in conversations:
        return jsonify({'error': 'Conversation not found'}), 404

    return jsonify({
        'conversation': conversations[conversation_id],
        'messages': messages.get(conversation_id, [])
    }), 200

@bp.route('/conversations/<conversation_id>/messages', methods=['POST'])
def send_message(conversation_id):
    """Send a message in a conversation"""
    if conversation_id not in conversations:
        return jsonify({'error': 'Conversation not found'}), 404

    data = request.get_json()
    sender = data.get('sender')
    sender_type = data.get('sender_type', 'user')
    message_text = data.get('message')
    has_audio = data.get('has_audio', False)

    if not sender or not message_text:
        return jsonify({'error': 'sender and message are required'}), 400

    message_id = str(uuid.uuid4())
    message = {
        'id': message_id,
        'sender': sender,
        'sender_type': sender_type,
        'message': message_text,
        'has_audio': has_audio,
        'timestamp': datetime.utcnow().isoformat()
    }

    messages[conversation_id].append(message)
    conversations[conversation_id]['updated_at'] = datetime.utcnow().isoformat()

    return jsonify(message), 201

@bp.route('/conversations/<conversation_id>/messages', methods=['GET'])
def get_messages(conversation_id):
    """Get all messages in a conversation"""
    if conversation_id not in conversations:
        return jsonify({'error': 'Conversation not found'}), 404

    return jsonify({
        'messages': messages.get(conversation_id, [])
    }), 200

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

    # TODO: Implement actual text-to-speech processing
    # For now, return a placeholder response

    return jsonify({
        'audio_url': None,
        'message': 'Text-to-speech processing coming soon'
    }), 200
