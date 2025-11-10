# Speech-to-Text Modes

This app supports two speech-to-text modes:

## 1. On-Device STT (Default) - **FREE**

- ✅ **No API costs** - completely free
- ✅ **Works offline** - no internet required
- ✅ **Fast** - instant transcription
- ✅ **Privacy-friendly** - audio never leaves the device
- ✅ **Good quality** - uses Google/Apple native STT
- ⚠️ Quality varies by device
- ⚠️ Language support depends on device settings

**Perfect for:**
- Proof of concept / demos
- Budget-constrained projects
- Offline functionality
- Privacy-sensitive applications

## 2. Whisper API - **$0.006/minute**

- ✅ **Consistent quality** - same across all devices
- ✅ **Excellent accuracy** - OpenAI's state-of-the-art model
- ✅ **Wide language support** - 90+ languages
- ⚠️ Requires internet connection
- ⚠️ Costs $0.006/min ($0.60 per 100 minutes)
- ⚠️ Higher latency (network + processing)

**Perfect for:**
- Production apps with quality requirements
- Multi-language support needed
- When consistency across devices is important

---

## How to Switch Modes

Edit `src/hooks/useSpeechToText.tsx`:

```typescript
// Line 24
const USE_WHISPER_API = false;  // On-device (FREE)
// or
const USE_WHISPER_API = true;   // Whisper API ($0.006/min)
```

Then rebuild the app.

---

## Current Setup

**Mode:** Whisper API ($0.006/min) ✅ ACTIVE
**Alternative:** On-Device STT (FREE) available by changing flag

Using Whisper API for reliable, consistent transcription quality across all devices.
