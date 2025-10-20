# Streaming Messages API Documentation

## Overview

The Wakaku STT backend supports real-time streaming of conversation messages using Server-Sent Events (SSE). This allows for a more interactive and responsive user experience where messages appear word-by-word as they're being sent.

## Endpoint

### Stream Conversation Message

**POST** `/api/conversations/<conversation_id>/messages/stream`

Streams a conversation message in real-time.

#### Request Body

```json
{
  "message": "Message text",
  "sender": "Sender Name",
  "sender_type": "user",
  "has_audio": false
}
```

#### Response Format

The endpoint returns a stream of Server-Sent Events with the following event types:

##### 1. Start Event
```json
{
  "type": "start",
  "message_id": "uuid-string"
}
```

##### 2. Chunk Events (multiple)
```json
{
  "type": "chunk",
  "message_id": "uuid-string",
  "text": "word ",
  "accumulated_text": "all text so far"
}
```

##### 3. Complete Event
```json
{
  "type": "complete",
  "message_id": "uuid-string",
  "message": {
    "id": "uuid-string",
    "sender": "John Doe",
    "sender_type": "user",
    "message": "complete message text",
    "has_audio": false,
    "timestamp": "2024-01-01T00:00:00.000000"
  }
}
```

##### 4. Done Signal
```
data: [DONE]
```

## Client-Side Integration (React Native)

### Example: Using EventSource for SSE

```javascript
const streamMessage = async (conversationId, message) => {
  const response = await fetch(
    `http://localhost:5001/api/conversations/${conversationId}/messages/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, sender: username }),
    }
  );

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulatedText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;

        try {
          const event = JSON.parse(data);

          switch (event.type) {
            case 'start':
              console.log('Streaming started:', event.message_id);
              break;
            case 'chunk':
              accumulatedText = event.accumulated_text;
              // Update UI with streaming text
              updateMessageUI(event.message_id, accumulatedText);
              break;
            case 'complete':
              console.log('Streaming complete:', event.message);
              // Save complete message
              saveMessage(event.message);
              break;
            case 'error':
              console.error('Streaming error:', event.error);
              break;
          }
        } catch (e) {
          console.error('Parse error:', e);
        }
      }
    }
  }
};
```

## Features

- **Real-time Streaming**: Messages appear progressively word-by-word
- **Multiple Message Types**: Support for user, caretaker, and other message types
- **Audio Support**: Flag messages that include audio
- **Error Handling**: Graceful error handling with detailed error messages
- **Server-Sent Events**: Standard SSE protocol for easy client integration
- **Conversation Storage**: Automatically saves messages to conversation history

## Testing

### Test with curl

```bash
# Start streaming a message
curl -X POST http://localhost:5001/api/conversations/<id>/messages/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you today?", "sender": "Test User", "sender_type": "user"}' \
  -N
```

The `-N` flag disables buffering to see the streaming in real-time.

## Future Enhancements

- [ ] Add WebSocket support as alternative to SSE
- [ ] Implement message editing and deletion via streaming
- [ ] Add typing indicators for multiple users
- [ ] Add streaming support for text-to-speech
- [ ] Implement rate limiting for API calls
- [ ] Add message read receipts
