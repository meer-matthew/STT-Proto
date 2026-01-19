import os
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
socketio = SocketIO()

def create_app() -> Flask:
    app = Flask(__name__)

    # Enable CORS for React Native app
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

    # Database configuration
    basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    db_path = os.path.join(basedir, 'stt.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='threading')

    # Import models after db initialization
    from app import models

    # Register blueprints
    from app.routes import conversation, health, auth, stt, tts, notifications, stt_streaming
    app.register_blueprint(conversation.bp)
    app.register_blueprint(health.bp)
    app.register_blueprint(auth.bp)
    app.register_blueprint(stt.bp)
    app.register_blueprint(stt_streaming.bp)
    app.register_blueprint(tts.bp)
    app.register_blueprint(notifications.bp)

    # Register WebSocket handlers
    from app.routes import stt_websocket
    stt_websocket.register_websocket_handlers(socketio)

    # Create database tables
    with app.app_context():
        db.create_all()

    return app
