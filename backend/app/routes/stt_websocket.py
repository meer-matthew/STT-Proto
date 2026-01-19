"""
Deepgram WebSocket STT Implementation
Provides real-time transcription with WebSocket streaming

Simplified approach: Use Flask-SocketIO for WebSocket connection,
and Deepgram HTTP API for transcription (lower latency than HTTP polling)
"""

from flask import request
from flask_socketio import emit, disconnect
import os
import base64
import requests

# Initialize Deepgram
DEEPGRAM_API_KEY = os.environ.get('DEEPGRAM_API')
DEEPGRAM_URL = 'https://api.deepgram.com/v1/listen'


def register_websocket_handlers(socketio):
    """Register WebSocket event handlers"""

    @socketio.on('connect', namespace='/api/stt/stream')
    def handle_connect():
        """Handle client WebSocket connection"""
        client_id = request.sid
        print(f'[WS STT] ✅ Client connected: {client_id}')

        if not DEEPGRAM_API_KEY:
            print('[WS STT ERROR] DEEPGRAM_API key not configured')
            emit('error', {'message': 'Deepgram API key not configured'})
            disconnect()
            return

        # Send ready signal to client
        emit('connected', {'status': 'ready'})
        print(f'[WS STT] Connection ready for client: {client_id}')

    @socketio.on('audio_data', namespace='/api/stt/stream')
    def handle_audio(data):
        """Handle incoming audio data from client"""
        client_id = request.sid

        try:
            # Get audio from client (base64 encoded)
            audio_base64 = data.get('audio')
            if not audio_base64:
                print('[WS STT ERROR] No audio data in message')
                return

            # Decode audio
            audio_bytes = base64.b64decode(audio_base64)
            print(f'[WS STT] 📦 Received {len(audio_bytes)} bytes from client: {client_id}')

            # Send to Deepgram HTTP API (same as existing chunk approach)
            headers = {
                'Authorization': f'Token {DEEPGRAM_API_KEY}',
                'Content-Type': 'application/octet-stream'
            }

            params = {
                'model': 'nova-2',
                'language': 'en',
                'encoding': 'linear16',
                'sample_rate': '16000',
            }

            response = requests.post(
                DEEPGRAM_URL,
                headers=headers,
                params=params,
                data=audio_bytes,
                timeout=5
            )

            if response.status_code == 200:
                result = response.json()

                # Extract transcript
                transcript_text = ''
                if 'results' in result and 'channels' in result['results']:
                    if len(result['results']['channels']) > 0:
                        channel = result['results']['channels'][0]
                        if 'alternatives' in channel and len(channel['alternatives']) > 0:
                            transcript_text = channel['alternatives'][0].get('transcript', '')

                if transcript_text.strip():
                    print(f'[WS STT] 📝 Transcript: "{transcript_text}"')
                    emit('transcript', {
                        'transcript': transcript_text,
                        'is_final': False,
                    })
                else:
                    print(f'[WS STT] 🔇 No speech detected')
            else:
                print(f'[WS STT ERROR] Deepgram error: {response.status_code}')

        except Exception as e:
            print(f'[WS STT ERROR] Error handling audio: {e}')
            emit('error', {'message': f'Audio processing error: {str(e)}'})

    @socketio.on('stop_recording', namespace='/api/stt/stream')
    def handle_stop():
        """Handle stop recording request"""
        client_id = request.sid
        print(f'[WS STT] 🛑 Stop recording request from client: {client_id}')

    @socketio.on('disconnect', namespace='/api/stt/stream')
    def handle_disconnect():
        """Handle client disconnection"""
        client_id = request.sid
        print(f'[WS STT] 🔌 Client disconnected: {client_id}')