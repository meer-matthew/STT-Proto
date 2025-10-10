# STT Backend API

Flask backend for the Speech-to-Text conversation application.

## Features

- RESTful API endpoints for conversation management
- Message sending and retrieval
- Speech-to-text processing (placeholder)
- Text-to-speech conversion (placeholder)
- CORS enabled for React Native integration

## Setup

### Prerequisites

- Python 3.8 or higher
- pip

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
```

3. Activate the virtual environment:
```bash
# On macOS/Linux
source venv/bin/activate

# On Windows
venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file:
```bash
cp .env.example .env
```

### Running the Server

Start the development server:
```bash
python run.py
```

The API will be available at `http://localhost:5000`

### Production Deployment

Use gunicorn for production:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

## API Endpoints

### Health Check
- **GET** `/health`
  - Returns server health status

### Conversations
- **POST** `/api/conversations`
  - Create a new conversation
  - Body: `{ "username": "string", "configuration": "string" }`

- **GET** `/api/conversations/:id`
  - Get conversation details and messages

### Messages
- **POST** `/api/conversations/:id/messages`
  - Send a message
  - Body: `{ "sender": "string", "sender_type": "user|caregiver", "message": "string", "has_audio": boolean }`

- **GET** `/api/conversations/:id/messages`
  - Get all messages in a conversation

### Speech Processing
- **POST** `/api/speech-to-text`
  - Convert audio to text (placeholder)
  - Body: multipart/form-data with `audio` file

- **POST** `/api/text-to-speech`
  - Convert text to speech (placeholder)
  - Body: `{ "text": "string" }`

## Project Structure

```
backend/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── routes/              # API route handlers
│   │   ├── health.py
│   │   └── conversation.py
│   ├── models/              # Data models (for future database)
│   └── services/            # Business logic services
├── run.py                   # Application entry point
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Connecting to React Native App

Update your React Native app to point to the backend:

1. For iOS simulator: `http://localhost:5000`
2. For Android emulator: `http://10.0.2.2:5000`
3. For physical device: Use your computer's IP address (e.g., `http://192.168.1.100:5000`)

## Future Enhancements

- [ ] Implement actual speech-to-text using services like Google Speech API or Whisper
- [ ] Implement text-to-speech using services like Google TTS or ElevenLabs
- [ ] Add database support (PostgreSQL/MongoDB)
- [ ] Add authentication and authorization
- [ ] Add WebSocket support for real-time messaging
- [ ] Add audio file storage (AWS S3, Google Cloud Storage)
- [ ] Add unit and integration tests
