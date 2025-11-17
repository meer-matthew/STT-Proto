"""
Deepgram Streaming STT Implementation
Provides real-time transcription with live audio feedback
"""

from flask import Blueprint, request, jsonify, Response
import os
import json
import requests
import base64
from app.routes.auth import token_required

bp = Blueprint('stt_streaming', __name__, url_prefix='/api/stt')

# Initialize Deepgram credentials
DEEPGRAM_API_KEY = os.environ.get('DEEPGRAM_API')
DEEPGRAM_STREAMING_URL = 'https://api.deepgram.com/v1/listen'


@bp.route('/stream-chunk', methods=['POST'])
@token_required
def transcribe_stream_chunk(current_user):
    """
    Send audio chunks for real-time transcription with Deepgram
    Supports continuous streaming of audio for live transcription and audio levels

    Headers:
    Authorization: Bearer <token>

    JSON Body:
    {
        "audio_base64": "base64 encoded audio chunk",
        "language": "en",
        "is_final": false
    }

    Response:
    {
        "transcript": "partial transcription",
        "confidence": 0.95,
        "is_final": false,
        "timestamp": 1234567890
    }
    """
    if not DEEPGRAM_API_KEY:
        print("[STT Stream ERROR] DEEPGRAM_API key not configured")
        return jsonify({'error': 'Deepgram API key not configured'}), 500

    try:
        data = request.get_json()
        audio_base64 = data.get('audio_base64')
        language = data.get('language', 'en')
        is_final = data.get('is_final', False)

        if not audio_base64:
            print("[STT Stream ERROR] No audio_base64 in request")
            return jsonify({'error': 'No audio_base64 provided'}), 400

        print(f"[STT Stream] Chunk received - Final: {is_final}, User: {current_user.username}")

        # Decode audio
        try:
            audio_bytes = base64.b64decode(audio_base64)
            print(f"[STT Stream] Audio chunk size: {len(audio_bytes)} bytes")
        except Exception as e:
            print(f"[STT Stream ERROR] Failed to decode audio: {e}")
            return jsonify({'error': 'Invalid base64 audio'}), 400

        # Prepare Deepgram request
        headers = {
            'Authorization': f'Token {DEEPGRAM_API_KEY}',
            'Content-Type': 'application/octet-stream'
        }

        # Build query string with proper parameter formatting
        # For streaming chunks, we receive raw PCM data (no headers)
        # So we specify the exact encoding format
        params = {
            'model': 'nova-2',
            'language': language,
            'encoding': 'linear16',  # Frontend sends raw PCM in 16-bit linear format
            'sample_rate': '16000',  # Explicitly tell Deepgram the sample rate
        }

        print(f"[STT Stream] Sending to Deepgram with params: {params}")

        # Send to Deepgram
        response = requests.post(
            DEEPGRAM_STREAMING_URL,
            headers=headers,
            params=params,
            data=audio_bytes,
            timeout=30
        )

        print(f"[STT Stream] Deepgram response status: {response.status_code}")

        if response.status_code != 200:
            print(f"[STT Stream ERROR] Deepgram error: {response.text}")
            return jsonify({'error': f'Deepgram transcription failed'}), 500

        result = response.json()
        print(f"[STT Stream] Full Deepgram response: {json.dumps(result, indent=2)}")

        # Extract transcript
        transcript_text = ''
        confidence = 0

        # Debug the response structure
        print(f"[STT Stream] Response keys: {result.keys() if isinstance(result, dict) else 'Not a dict'}")

        if 'results' in result and 'channels' in result['results']:
            print(f"[STT Stream] Found results.channels, length: {len(result['results']['channels'])}")
            if len(result['results']['channels']) > 0:
                channel = result['results']['channels'][0]
                print(f"[STT Stream] Channel keys: {channel.keys()}")
                if 'alternatives' in channel and len(channel['alternatives']) > 0:
                    print("Hello",channel['alternatives'][0] )
                    alt = channel['alternatives'][0]
                    transcript_text = alt.get('transcript', '')
                    confidence = alt.get('confidence', 0)
                    print(f"[STT Stream] Found alternative, transcript: '{transcript_text}'")
                else:
                    print(f"[STT Stream] No alternatives in channel or empty")
            else:
                print(f"[STT Stream] Channels list is empty")
        else:
            print(f"[STT Stream] No results.channels in response")

        print(f"[STT Stream] Final Transcription: '{transcript_text}' (confidence: {confidence})")

        return jsonify({
            'transcript': transcript_text,
            'confidence': confidence,
            'is_final': is_final,
            'language': language,
            'timestamp': int(request.get_json().get('timestamp', 0))
        }), 200

    except requests.exceptions.Timeout:
        print("[STT Stream ERROR] Deepgram request timeout")
        return jsonify({'error': 'Transcription request timed out'}), 500
    except requests.exceptions.RequestException as e:
        print(f"[STT Stream ERROR] Request failed: {e}")
        return jsonify({'error': f'Transcription failed: {str(e)}'}), 500
    except Exception as e:
        print(f"[STT Stream ERROR] {str(e)}")
        return jsonify({'error': f'Error: {str(e)}'}), 500
