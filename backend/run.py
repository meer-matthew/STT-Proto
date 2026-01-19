import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app, socketio

app = create_app()

if __name__ == '__main__':
    # Use socketio.run() instead of app.run() to enable WebSocket support
    socketio.run(app, host='0.0.0.0', port=5001, debug=True, allow_unsafe_werkzeug=True)
