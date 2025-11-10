from flask import Blueprint, request, jsonify, send_file
import os
import tempfile
from openai import OpenAI
from pathlib import Path

from app.routes.auth import token_required

bp = Blueprint('tts', __name__, url_prefix='/api/tts')

# Initialize OpenAI client - handle missing API key gracefully
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
client = None
if OPENAI_API_KEY:
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        print(f"Warning: Could not initialize OpenAI client: {e}")

# Available voices
AVAILABLE_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
DEFAULT_VOICE = 'nova'  # Female voice, popular choice


@bp.route('/synthesize', methods=['POST'])
@token_required
def synthesize_speech(current_user):
    """
    Synthesize speech from text using OpenAI TTS API

    Headers:
    Authorization: Bearer <token>

    JSON Body:
    {
        "text": "Text to convert to speech",
        "voice": "nova" (optional, defaults to 'nova')
    }

    Response:
    Audio file (MP3 format)
    """
    print(f"[TTS] Speech synthesis request from user: {current_user.username}")

    # Check if OpenAI client is initialized
    if not client:
        print("[TTS ERROR] OpenAI API key not configured")
        return jsonify({'error': 'TTS service not configured. OpenAI API key is missing.'}), 500

    try:
        # Get request data
        data = request.get_json()
        text = data.get('text')
        voice = data.get('voice', DEFAULT_VOICE)

        # Validate text
        if not text or not text.strip():
            print("[TTS ERROR] No text provided")
            return jsonify({'error': 'No text provided'}), 400

        # Validate voice
        if voice not in AVAILABLE_VOICES:
            print(f"[TTS ERROR] Invalid voice: {voice}")
            return jsonify({
                'error': f'Invalid voice. Available voices: {", ".join(AVAILABLE_VOICES)}'
            }), 400

        print(f"[TTS] Text: {text[:50]}{'...' if len(text) > 50 else ''}")
        print(f"[TTS] Voice: {voice}")
        print(f"[TTS] Text length: {len(text)} characters")

        # Create temporary file for audio
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        temp_file_path = temp_file.name
        temp_file.close()

        print(f"[TTS] Calling OpenAI TTS API...")

        # Call OpenAI TTS API
        response = client.audio.speech.create(
            model="tts-1",  # Use tts-1 for faster response, tts-1-hd for higher quality
            voice=voice,
            input=text,
            response_format="mp3"
        )

        # Stream the response to file
        response.stream_to_file(temp_file_path)

        print(f"[TTS] Audio generated successfully")
        print(f"[TTS] File size: {os.path.getsize(temp_file_path)} bytes")

        # Send the audio file
        return send_file(
            temp_file_path,
            mimetype='audio/mpeg',
            as_attachment=False,
            download_name='speech.mp3'
        )

    except Exception as e:
        print(f"[TTS ERROR] Error: {str(e)}")
        import traceback
        print(f"[TTS ERROR] Traceback: {traceback.format_exc()}")

        # Clean up temp file if it exists
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except:
                pass

        return jsonify({'error': f'Speech synthesis failed: {str(e)}'}), 500


@bp.route('/voices', methods=['GET'])
@token_required
def get_available_voices(current_user):
    """
    Get list of available TTS voices

    Headers:
    Authorization: Bearer <token>

    Response:
    {
        "voices": [
            {"id": "alloy", "name": "Alloy", "description": "Neutral and balanced"},
            ...
        ],
        "default": "nova"
    }
    """
    voices = [
        {"id": "alloy", "name": "Alloy", "description": "Neutral and balanced"},
        {"id": "echo", "name": "Echo", "description": "Male voice"},
        {"id": "fable", "name": "Fable", "description": "Warm and expressive"},
        {"id": "onyx", "name": "Onyx", "description": "Deep male voice"},
        {"id": "nova", "name": "Nova", "description": "Female voice"},
        {"id": "shimmer", "name": "Shimmer", "description": "Bright female voice"}
    ]

    return jsonify({
        'voices': voices,
        'default': DEFAULT_VOICE
    }), 200