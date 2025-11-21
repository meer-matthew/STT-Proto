"""
WSGI entry point for the Flask application.
This file ensures the app can be run from any directory.
"""
import sys
import os
from flask import Flask

# Get the absolute path of this file's directory (backend/)
current_dir = os.path.dirname(os.path.abspath(__file__))

# Make sure we can import from the backend directory
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Import and create Flask app
try:
    from app import create_app
    app: Flask = create_app()
except ImportError as e:
    print(f"Error importing app: {e}")
    print(f"Current directory: {current_dir}")
    print(f"Python path: {sys.path}")
    raise

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
