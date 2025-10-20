# AssemblyAI Speech-to-Text Integration

This document explains how the AssemblyAI integration works and how to set it up.

## Overview

The application uses AssemblyAI's Speech-to-Text API to transcribe audio recordings. The process works as follows:

1. **Mobile App Records Audio**: The React Native app records audio using `react-native-nitro-sound`
2. **Upload to Backend**: The recorded audio file is uploaded to the Flask backend
3. **Backend Transcribes**: The backend sends the audio to AssemblyAI for transcription
4. **Return Results**: The transcribed text is returned to the mobile app

## Benefits of AssemblyAI

- **High Accuracy**: Industry-leading speech recognition accuracy
- **Automatic Punctuation**: Adds punctuation and formatting automatically
- **Speaker Diarization**: Can identify different speakers (optional)
- **Multiple Languages**: Supports 58+ languages
- **No Device Dependency**: Works consistently across all devices

## Setup Instructions

### 1. Get AssemblyAI API Key

1. Go to [AssemblyAI Dashboard](https://www.assemblyai.com/dashboard/signup)
2. Sign up for a free account
3. Navigate to your API keys section
4. Copy your API key

**Free Tier Includes:**
- $50 in free credits
- No credit card required
- ~5 hours of audio transcription

### 2. Configure Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy `.env.example` to `.env` if you haven't already:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file and add your AssemblyAI API key:
   ```bash
   # Speech-to-Text Configuration
   STT_PROVIDER=assemblyai
   ASSEMBLYAI_API_KEY=your-actual-api-key-here
   ```

4. Install the required Python package:
   ```bash
   pip install assemblyai==0.17.0
   ```

### 3. Test the Integration

1. Start the backend server:
   ```bash
   python run.py
   ```

2. Test the STT service endpoint:
   ```bash
   curl -X GET http://localhost:5001/api/speech/test \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN"
   ```

   Expected response:
   ```json
   {
     "provider": "assemblyai",
     "configured": true,
     "available": true
   }
   ```

## How It Works

### Mobile App (React Native)

The `useSpeechToText` hook handles audio recording:

```typescript
// Start recording
await startRecording();  // Records to local file

// Stop recording and transcribe
await stopRecording();   // Uploads to backend, gets transcription
```

### Backend (Flask)

The backend handles the transcription process:

1. **Receive Audio File** (`/api/speech/transcribe`):
   - Validates file type and size
   - Saves temporarily with unique filename

2. **Send to AssemblyAI**:
   - Uses AssemblyAI SDK to upload and transcribe
   - Waits for transcription to complete

3. **Return Results**:
   - Returns transcribed text and confidence scores
   - Cleans up temporary files

### Configuration Options

You can customize the transcription in `app/services/speech_service.py`:

```python
config = aai.TranscriptionConfig(
    punctuate=True,           # Add punctuation
    format_text=True,         # Format text nicely
    speaker_labels=False,     # Enable speaker diarization
    language_code='en',       # Set language
    word_boost=['technical', 'terms']  # Boost specific words
)
```

## Supported Audio Formats

The integration supports these audio formats:
- WAV
- MP3
- M4A (default for iOS/Android recordings)
- MP4
- WEBM
- OGG
- FLAC

## File Size Limits

- **Maximum file size**: 16MB (configurable in `.env`)
- **Recommended recording length**: 1-5 minutes
- **Maximum supported length**: 4 hours

## Error Handling

Common errors and solutions:

### "AssemblyAI API key not configured"
- Solution: Add your API key to the `.env` file

### "File too large"
- Solution: Reduce recording length or increase `MAX_CONTENT_LENGTH` in config

### "Invalid file type"
- Solution: Ensure the recorded file is in a supported format (M4A is default)

### "Transcription failed"
- Check AssemblyAI dashboard for API status
- Verify your API key is valid
- Check audio file is not corrupted

## Monitoring Usage

1. Log in to [AssemblyAI Dashboard](https://www.assemblyai.com/dashboard)
2. View usage statistics and remaining credits
3. Monitor transcription history and accuracy

## Alternative: Device-Based STT

If you want to use device-based speech recognition instead:

1. Set `STT_PROVIDER=device` in `.env`
2. The app will fall back to using `@react-native-voice/voice`
3. No API key or internet required, but lower accuracy

## Troubleshooting

### Backend Issues

Check backend logs for detailed error messages:
```bash
tail -f backend/logs/app.log
```

### Mobile App Issues

Check React Native logs:
```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

### Network Issues

Ensure your backend is accessible from the mobile device:
- Update `HOST_IP` in `src/config/api.config.ts`
- Check firewall settings
- Verify backend is running on correct port (5001)

## Cost Estimation

AssemblyAI Pricing (as of 2024):
- **Free Tier**: $50 in credits (~5 hours)
- **Pay-as-you-go**: $0.00025 per second ($0.015 per minute)
- **Estimated cost**: ~$0.90 per hour of audio

Example usage:
- 100 messages/day × 30 seconds = 50 minutes/day
- Cost: ~$0.75/day or ~$22.50/month

## Support

For issues with:
- **AssemblyAI API**: [AssemblyAI Support](https://www.assemblyai.com/docs)
- **This Integration**: Check the backend logs and mobile app logs
- **General Questions**: See the main README.md

## Additional Resources

- [AssemblyAI Documentation](https://www.assemblyai.com/docs)
- [AssemblyAI Python SDK](https://github.com/AssemblyAI/assemblyai-python-sdk)
- [React Native Nitro Sound](https://github.com/nitro-sound/react-native-nitro-sound)