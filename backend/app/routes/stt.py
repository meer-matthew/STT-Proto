from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import tempfile
import requests
import json

from app.routes.auth import token_required

bp = Blueprint('stt', __name__, url_prefix='/api/stt')

# Initialize Deepgram API key
DEEPGRAM_API_KEY = os.environ.get('DEEPGRAM_API')
DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen'

# Allowed audio file extensions
ALLOWED_EXTENSIONS = {'m4a', 'mp3', 'webm', 'mp4', 'mpga', 'wav', 'mpeg'}


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@bp.route('/transcribe', methods=['POST'])
@token_required
def transcribe_audio(current_user):
    """
    Transcribe audio using Deepgram API

    Headers:
    Authorization: Bearer <token>

    JSON Body (new format):
    {
        "audio_base64": "base64 encoded audio",
        "language": "en"
    }

    OR Form Data (legacy format):
    - audio: Audio file (required)
    - language: Language code (optional, e.g., 'en')

    Response:
    {
        "text": "transcribed text",
        "language": "en"
    }
    """
    print(f"[STT] Transcription request from user: {current_user.username}")
    print(f"[STT] Content-Type: {request.content_type}")

    language = 'en'
    temp_file_path = None

    try:
        # Check if request is JSON with base64 audio
        if request.is_json:
            data = request.get_json()
            audio_base64 = data.get('audio_base64')
            language = data.get('language', 'en')

            if not audio_base64:
                print("[STT ERROR] No audio_base64 in JSON request")
                return jsonify({'error': 'No audio_base64 provided'}), 400

            print(f"[STT] Received base64 audio, length: {len(audio_base64)}")
            print(f"[STT] First 100 chars: {audio_base64[:100]}")
            print(f"[STT] Language: {language}")

            # Decode base64 to bytes
            import base64
            try:
                # Clean the base64 string - remove data URI prefix if present
                if audio_base64.startswith('data:'):
                    print("[STT] Removing data URI prefix")
                    audio_base64 = audio_base64.split(',', 1)[1] if ',' in audio_base64 else audio_base64

                # Remove whitespace
                audio_base64 = audio_base64.strip().replace('\n', '').replace('\r', '')

                print(f"[STT] Cleaned base64 length: {len(audio_base64)}")
                print(f"[STT] Cleaned first 50 chars: {audio_base64[:50]}")

                audio_bytes = base64.b64decode(audio_base64)
                print(f"[STT] Decoded audio size: {len(audio_bytes)} bytes")
            except Exception as decode_error:
                print(f"[STT ERROR] Failed to decode base64: {str(decode_error)}")
                print(f"[STT ERROR] Error type: {type(decode_error).__name__}")
                import traceback
                print(f"[STT ERROR] Traceback: {traceback.format_exc()}")
                return jsonify({'error': f'Invalid base64 audio data: {str(decode_error)}'}), 400

            # Create temporary WAV file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
                temp_file.write(audio_bytes)
                temp_file_path = temp_file.name
                print(f"[STT] Saved to temp file: {temp_file_path}")

        # Legacy form data format
        elif 'audio' in request.files:
            audio_file = request.files['audio']
            print(f"[STT] Audio file received: {audio_file.filename}")

            # Check if file is empty
            if audio_file.filename == '':
                print("[STT ERROR] Empty filename")
                return jsonify({'error': 'No file selected'}), 400

            # Check if file extension is allowed
            if not allowed_file(audio_file.filename):
                print(f"[STT ERROR] File type not allowed: {audio_file.filename}")
                return jsonify({'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400

            # Get optional language parameter
            language = request.form.get('language', 'en')
            print(f"[STT] Language: {language}")

            # Create a temporary file to save the audio
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio_file.filename)[1]) as temp_file:
                audio_file.save(temp_file.name)
                temp_file_path = temp_file.name
                file_size = os.path.getsize(temp_file_path)
                print(f"[STT] Saved to temp file: {temp_file_path}, Size: {file_size} bytes")
        else:
            print("[STT ERROR] No audio data in request")
            return jsonify({'error': 'No audio data provided'}), 400

        # Send to Deepgram API
        print("[STT] Sending to Deepgram API...")

        if not DEEPGRAM_API_KEY:
            print("[STT ERROR] DEEPGRAM_API key not configured")
            return jsonify({'error': 'Deepgram API key not configured'}), 500

        try:
            with open(temp_file_path, 'rb') as audio_file:
                audio_data = audio_file.read()

            # Prepare Deepgram request headers
            headers = {
                'Authorization': f'Token {DEEPGRAM_API_KEY}',
                'Content-Type': 'application/octet-stream'
            }

            # Prepare Deepgram query parameters
            # Using language parameter to match Deepgram's API
            params = {
                'model': 'nova-2',  # Latest Deepgram model, better than Whisper
                'language': language,
            }

            # Send request to Deepgram
            print(f"[STT] Making request to Deepgram with language: {language}")
            response = requests.post(
                DEEPGRAM_API_URL,
                headers=headers,
                params=params,
                data=audio_data,
                timeout=30
            )

            print(f"[STT] Deepgram response status: {response.status_code}")

            if response.status_code != 200:
                print(f"[STT ERROR] Deepgram API error: {response.text}")
                return jsonify({'error': f'Deepgram transcription failed: {response.text}'}), 500

            result = response.json()
            print(f"[STT] Deepgram response: {json.dumps(result, indent=2)}")

            # Extract transcript from Deepgram response
            if 'results' in result and 'channels' in result['results']:
                transcript_text = ''
                if len(result['results']['channels']) > 0:
                    channel = result['results']['channels'][0]
                    if 'alternatives' in channel and len(channel['alternatives']) > 0:
                        transcript_text = channel['alternatives'][0]['transcript']

                if not transcript_text:
                    print("[STT] No transcript found in Deepgram response")
                    transcript_text = ""

                print(f"[STT] Transcription successful: {transcript_text}")

                # Clean up temporary file
                if temp_file_path and os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)

                return jsonify({
                    'text': transcript_text,
                    'language': language
                }), 200
            else:
                print("[STT ERROR] Unexpected Deepgram response format")
                return jsonify({'error': 'Unexpected Deepgram response format'}), 500

        except requests.exceptions.Timeout:
            print("[STT ERROR] Deepgram request timed out")
            return jsonify({'error': 'Transcription request timed out'}), 500
        except requests.exceptions.RequestException as e:
            print(f"[STT ERROR] Deepgram request failed: {str(e)}")
            return jsonify({'error': f'Deepgram request failed: {str(e)}'}), 500

    except Exception as e:
        print(f"[STT ERROR] Error: {str(e)}")
        # Clean up temporary file in case of error
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        return jsonify({'error': f'Transcription failed: {str(e)}'}), 500


@bp.route('/languages', methods=['GET'])
@token_required
def get_supported_languages(current_user):
    """
    Get list of supported languages for Whisper

    Headers:
    Authorization: Bearer <token>

    Response:
    {
        "languages": {
            "en": "English",
            "es": "Spanish",
            ...
        }
    }
    """
    # Common languages supported by Whisper
    languages = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'nl': 'Dutch',
        'pl': 'Polish',
        'ru': 'Russian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'tr': 'Turkish',
        'vi': 'Vietnamese'
    }

    return jsonify({
        'languages': languages
    }), 200