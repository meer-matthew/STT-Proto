/**
 * Speech-to-Text Hook
 *
 * Supports two modes:
 * 1. On-Device STT (default) - FREE, uses device's native speech recognition
 * 2. Whisper API - Paid ($0.006/min), uses OpenAI Whisper for cloud transcription
 *
 * To switch modes, change USE_WHISPER_API constant below.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Voice from '@react-native-voice/voice';
import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';
import { API_CONFIG } from '../config/api.config';
import { authService } from '../services/authService';

// Polyfill for btoa in React Native
const btoa = (str: string): string => {
    // For React Native, we can use a simple encoding approach
    // If Buffer is available, use it; otherwise use a fallback
    try {
        return Buffer.from(str, 'binary').toString('base64');
    } catch {
        // Fallback: Use built-in btoa if available, or encode manually
        if (typeof global !== 'undefined' && global.btoa) {
            return global.btoa(str);
        }
        // Last resort: encode as utf8
        return Buffer.from(str, 'utf8').toString('base64');
    }
};

// ============================================================
// CONFIGURATION: Set to true to use Whisper API instead of on-device STT
// - false (default) = FREE on-device recognition (Google/Apple STT) + LIVE transcription
// - true = Whisper API ($0.006/min, better quality and consistency) but NO live transcription
// ============================================================
// Use Deepgram Streaming for live transcription and audio levels
const USE_DEEPGRAM_STREAMING = true;
// Fallback to Whisper for complete audio transcription (if streaming fails)
const USE_WHISPER_API = true;

export function useSpeechToText() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState(true);
    const [audioLevel, setAudioLevel] = useState(0);
    const [hasPermissions, setHasPermissions] = useState(false);
    const [isAudioRecordInitialized, setIsAudioRecordInitialized] = useState(false);

    // Audio level tracking with proper listener management
    const audioLevelListenerRef = useRef<any>(null);
    const lastUpdateTimeRef = useRef<number>(0);
    const THROTTLE_INTERVAL = 50; // Update audio level max every 50ms (~20Hz)

    // Adaptive audio level normalization
    const audioLevelHistoryRef = useRef<number[]>([]); // Store recent peak levels
    const MAX_HISTORY = 20; // Keep last 20 measurements
    const silenceThresholdRef = useRef<number>(100); // Minimum level for silence detection

    // Track accumulated transcript from streaming chunks
    const accumulatedTranscriptRef = useRef<string>('');

    // Buffer audio chunks before sending to avoid tiny incomplete fragments
    const audioBufferRef = useRef<string>('');
    const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const BUFFER_INTERVAL = 1000; // Send buffered audio every 1000ms (reduced API calls)

    // Automatic silence detection for stopping recording
    const silenceDetectionTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastAudioDetectedRef = useRef<number>(0);
    const SILENCE_DURATION = 1200; // 1.2 seconds of silence before auto-stop (more forgiving)
    const autoStopCallbackRef = useRef<(() => Promise<void>) | null>(null);

    // Fine-tuned silence threshold detection
    const silenceCounterRef = useRef(0);
    const SILENCE_SAMPLES_THRESHOLD = 3; // Require 3 consecutive silent samples before confirming silence


    /**
     * Send audio chunk to Deepgram streaming endpoint for live transcription
     * Optimized with minimal logging for performance
     */
    const sendAudioChunkForTranscription = useCallback(async (audioData: string) => {
        if (!USE_DEEPGRAM_STREAMING) {
            console.log('[Streaming] Streaming disabled (USE_DEEPGRAM_STREAMING=false)');
            return;
        }

        try {
            const token = await authService.getToken();
            if (!token) {
                console.warn('[Streaming] No auth token available');
                return;
            }

            // For streaming, send raw PCM chunks WITHOUT WAV headers
            // (Each chunk shouldn't have its own header - that makes it look like a separate file)
            // Deepgram will auto-detect the format from the params we send
            let base64Audio;
            try {
                base64Audio = btoa(audioData);
            } catch (e) {
                console.warn('[Streaming] Audio encoding failed:', e);
                return;
            }

            console.log('[Streaming] Sending audio chunk to backend, size:', audioData.length, 'bytes');

            const endpoint = `${API_CONFIG.BASE_URL}/api/stt/stream-chunk`;
            console.log('[Streaming] Endpoint:', endpoint);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audio_base64: base64Audio,
                    language: 'en',
                    is_final: false,
                    timestamp: Date.now()
                }),
            });

            console.log('[Streaming] Response status:', response.status);

            if (!response.ok) {
                console.error('[Streaming] API error - status:', response.status);
                const errorText = await response.text();
                console.error('[Streaming] Error response:', errorText);
                return;
            }

            let result;
            try {
                result = await response.json();
                console.log('[Streaming] Full response received:', JSON.stringify(result, null, 2));
                console.log('[Streaming] Response keys:', Object.keys(result));
                console.log('[Streaming] transcript field:', result.transcript);
                console.log('[Streaming] transcript type:', typeof result.transcript);
                console.log('[Streaming] transcript length:', result.transcript ? result.transcript.length : 'N/A');
            } catch (parseErr) {
                console.warn('[Streaming] Failed to parse response:', parseErr);
                return;
            }

            // Accumulate transcript from streaming chunks
            if (result.transcript && result.transcript.trim()) {
                const newText = result.transcript.trim();
                console.log('[Streaming] ✓ New transcript chunk:', newText);

                // Only add if it's not already in the accumulated transcript (prevent duplicates)
                if (!accumulatedTranscriptRef.current.endsWith(newText)) {
                    // Add space if we already have text
                    if (accumulatedTranscriptRef.current) {
                        accumulatedTranscriptRef.current += ' ' + newText;
                    } else {
                        accumulatedTranscriptRef.current = newText;
                    }

                    console.log('[Streaming] ✓ Updated transcript:', accumulatedTranscriptRef.current);
                    setTranscript(accumulatedTranscriptRef.current);
                } else {
                    console.log('[Streaming] Transcript already ends with:', newText, '- skipping duplicate');
                }
            } else {
                console.log('[Streaming] ✗ No transcript in response or empty. Result:', result);
            }
        } catch (err) {
            console.error('[Streaming] Unexpected error:', err);
        }
    }, []);

    /**
     * Handle audio data with throttling to prevent excessive state updates
     * Properly calculates RMS (Root Mean Square) for accurate volume metering
     * Optimized for performance with minimal logging
     */
    const handleAudioData = useCallback((data: any) => {
        if (!data) {
            console.log('[Audio] handleAudioData called but data is empty/null');
            return;
        }

        // Ensure data is in string format for processing
        let audioData = data;
        if (typeof data !== 'string') {
            console.log('[Audio] Converting data from', data.constructor.name, 'to string');
            if (Buffer.isBuffer(data)) {
                audioData = data.toString('binary');
            } else if (data instanceof Uint8Array) {
                audioData = String.fromCharCode(...Array.from(data));
            } else {
                console.warn('[Audio] Unknown data type:', data.constructor.name);
                return;
            }
        }

        console.log('[Audio] handleAudioData called, data length:', audioData.length);

        const now = Date.now();

        // Throttle updates to 20Hz to reduce CPU usage and UI flicker
        if (now - lastUpdateTimeRef.current < THROTTLE_INTERVAL) {
            return;
        }

        lastUpdateTimeRef.current = now;

        try {
            // Calculate RMS (Root Mean Square) - the proper way to measure audio level
            // PCM16 audio = 16-bit signed samples, so we need to process 2 bytes per sample
            let sumSquares = 0;
            let sampleCount = 0;
            const dataLen = audioData.length - 1;

            // Process pairs of bytes as 16-bit signed samples (optimized loop)
            for (let i = 0; i < dataLen; i += 2) {
                // Convert two bytes to 16-bit signed integer (little-endian)
                let sample = (audioData.charCodeAt(i + 1) << 8) | audioData.charCodeAt(i);

                // Convert to signed 16-bit
                if (sample > 32767) {
                    sample -= 65536;
                }

                // Accumulate sum of squares for RMS calculation
                sumSquares += sample * sample;
                sampleCount++;
            }

            // Calculate RMS value
            const rmsLevel = sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0;

            // Store peak in history for adaptive normalization (with early exit)
            const history = audioLevelHistoryRef.current;
            history.push(rmsLevel);
            if (history.length > MAX_HISTORY) {
                history.shift();
            }

            // Calculate peak from recent history - optimized with early tracking
            let peakInHistory = 1;
            for (let i = 0; i < history.length; i++) {
                if (history[i] > peakInHistory) {
                    peakInHistory = history[i];
                }
            }

            // Update silence threshold dynamically
            if (rmsLevel > 0) {
                silenceThresholdRef.current = Math.max(peakInHistory * 0.02, 50);
            }

            // Normalize to 0-10 scale
            let normalizedLevel = peakInHistory > 0 ? Math.min((rmsLevel / peakInHistory) * 10, 10) : 0;

            // Apply gentle logarithmic scaling
            if (normalizedLevel > 0.1) {
                normalizedLevel = Math.log10(normalizedLevel * 10 + 1) * 3.33;
            }

            // Detect audio vs silence
            const isAudible = rmsLevel > silenceThresholdRef.current;

            if (isAudible) {
                setAudioLevel(normalizedLevel);
                silenceCounterRef.current = 0;
                lastAudioDetectedRef.current = now;

                if (silenceDetectionTimerRef.current) {
                    clearTimeout(silenceDetectionTimerRef.current);
                    silenceDetectionTimerRef.current = null;
                }
            } else {
                // Silence detected
                silenceCounterRef.current++;
                const fadedLevel = Math.max(normalizedLevel - (silenceCounterRef.current * 0.5), 0);
                setAudioLevel(fadedLevel);

                // Start auto-stop timer only when needed
                if (silenceCounterRef.current >= SILENCE_SAMPLES_THRESHOLD && !silenceDetectionTimerRef.current && lastAudioDetectedRef.current > 0) {
                    silenceDetectionTimerRef.current = setTimeout(async () => {
                        const timeSinceLast = now - lastAudioDetectedRef.current;
                        if (timeSinceLast >= SILENCE_DURATION && autoStopCallbackRef.current) {
                            silenceDetectionTimerRef.current = null;
                            try {
                                await autoStopCallbackRef.current();
                            } catch (err) {
                                console.error('[Audio] Auto-stop error:', err);
                            }
                        }
                    }, SILENCE_DURATION);
                }
            }

            // Buffer audio chunk for periodic transcription
            if (USE_DEEPGRAM_STREAMING) {
                // Ensure data is in correct format
                let audioChunk = data;
                if (typeof data !== 'string') {
                    if (Buffer.isBuffer(data)) {
                        audioChunk = data.toString('binary');
                    } else if (data instanceof Uint8Array) {
                        audioChunk = String.fromCharCode(...Array.from(data));
                    }
                }

                // Add chunk to buffer
                audioBufferRef.current += audioChunk;
                console.log('[Audio] Buffered audio size now:', audioBufferRef.current.length, 'bytes');

                // Clear existing timeout and set a new one to flush periodically
                if (bufferTimeoutRef.current) {
                    clearTimeout(bufferTimeoutRef.current);
                }
                bufferTimeoutRef.current = setTimeout(() => {
                    console.log('[Audio] Buffer timeout fired, current buffer size:', audioBufferRef.current.length);
                    if (audioBufferRef.current && audioBufferRef.current.length > 0) {
                        const bufferedAudio = audioBufferRef.current;
                        audioBufferRef.current = '';
                        console.log('[Audio] Sending buffered audio:', bufferedAudio.length, 'bytes');
                        sendAudioChunkForTranscription(bufferedAudio);
                    } else {
                        console.log('[Audio] Buffer was empty at timeout');
                    }
                }, BUFFER_INTERVAL);
            }
        } catch (err) {
            console.error('[Audio] Error:', err);
        }
    }, [sendAudioChunkForTranscription]);

    /**
     * Setup audio level listener (called when starting recording)
     */
    const setupAudioLevelListener = useCallback(() => {
        console.log('[Audio] ===== Setting up audio level listener =====');
        console.log('[Audio] AudioRecord type:', typeof AudioRecord);
        console.log('[Audio] AudioRecord.on type:', typeof AudioRecord.on);
        console.log('[Audio] USE_DEEPGRAM_STREAMING:', USE_DEEPGRAM_STREAMING);

        // Remove any existing listener first to prevent duplicates
        if (audioLevelListenerRef.current) {
            try {
                console.log('[Audio] Removing old listener');
                AudioRecord.off?.('data', audioLevelListenerRef.current);
            } catch (err) {
                console.warn('[Audio] Error removing old listener:', err);
            }
        }

        // Add new listener
        audioLevelListenerRef.current = handleAudioData;
        console.log('[Audio] Calling AudioRecord.on("data", handleAudioData)...');
        try {
            AudioRecord.on('data', handleAudioData);
            console.log('[Audio] ✓ Audio level listener attached successfully');
        } catch (err) {
            console.error('[Audio] ✗ Failed to attach listener:', err);
        }
    }, [handleAudioData]);

    /**
     * Cleanup audio level listener (called when stopping recording)
     */
    const cleanupAudioLevelListener = useCallback(() => {
        if (audioLevelListenerRef.current) {
            try {
                AudioRecord.off?.('data', audioLevelListenerRef.current);
                audioLevelListenerRef.current = null;
                console.log('[Audio] Audio level listener removed');
            } catch (err) {
                console.warn('[Audio] Error removing listener:', err);
            }
        }
    }, []);

    // Check if permissions are already granted
    const checkPermissions = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const recordAudioGranted = await PermissionsAndroid.check(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
                );

                console.log('Permissions status:', { recordAudioGranted });
                return recordAudioGranted;
            } catch (err) {
                console.error('Error checking permissions:', err);
                return false;
            }
        }
        return true;
    };

    // Request necessary permissions on Android
    const requestPermissions = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                console.log('Requesting RECORD_AUDIO permission...');
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'This app needs access to your microphone for speech-to-text.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Deny',
                        buttonPositive: 'Allow',
                    }
                );

                console.log('Permission grant result:', granted);
                const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;

                if (!isGranted) {
                    console.log('Microphone permission was denied');
                }

                return isGranted;
            } catch (err) {
                console.error('Error requesting permissions:', err);
                return false;
            }
        }
        // iOS permissions handled via Info.plist
        return true;
    };

    // Initialize Voice recognition on mount
    useEffect(() => {
        const initializeVoice = async () => {
            console.log('[Init] Starting initialization...');
            console.log('[Init] USE_WHISPER_API:', USE_WHISPER_API);
            console.log('[Init] Platform:', Platform.OS);

            // Check permissions FIRST
            console.log('[Init] Checking permissions...');
            const alreadyHasPermissions = await checkPermissions();
            console.log('[Init] Already has permissions:', alreadyHasPermissions);

            if (!alreadyHasPermissions) {
                console.log('[Init] Requesting permissions...');
                const granted = await requestPermissions();
                console.log('[Init] Permissions granted:', granted);
                setHasPermissions(granted);

                if (!granted) {
                    console.log('[Init] Permissions denied, cannot initialize AudioRecord');
                    setIsAvailable(false);
                    return;
                }
            } else {
                setHasPermissions(true);
            }

            // NOW initialize AudioRecord after permissions are granted
            if (USE_WHISPER_API) {
                try {
                    // Initialize AudioRecord for Whisper API
                    console.log('[Whisper] Initializing AudioRecord...');
                    const options = {
                        sampleRate: 16000,
                        channels: 1,
                        bitsPerSample: 16,
                        audioSource: 6,
                        wavFile: 'recording.wav'
                    };
                    AudioRecord.init(options);
                    setIsAvailable(true);
                    setIsAudioRecordInitialized(true);
                    console.log('[Whisper] AudioRecord initialized successfully');
                } catch (initError) {
                    console.error('[Whisper] AudioRecord initialization error:', initError);
                    setIsAvailable(false);
                    setIsAudioRecordInitialized(false);
                    setError('Failed to initialize audio recorder');
                }
            } else {
                // Initialize React Native Voice for on-device STT
                try {
                    console.log('[Voice] Initializing Voice library...');
                    console.log('[Voice] Voice object:', typeof Voice);

                    // Set up event listeners
                    Voice.onSpeechStart = () => {
                        console.log('[Voice] Speech started');
                        setIsRecording(true);
                    };

                    Voice.onSpeechEnd = () => {
                        console.log('[Voice] Speech ended');
                    };

                    Voice.onSpeechResults = (e: any) => {
                        console.log('[Voice] Results:', e.value);
                        if (e.value && e.value.length > 0) {
                            setTranscript(e.value[0]);
                        }
                    };

                    Voice.onSpeechPartialResults = (e: any) => {
                        console.log('[Voice] Partial results:', e.value);
                        if (e.value && e.value.length > 0) {
                            setTranscript(e.value[0]);
                        }
                    };

                    Voice.onSpeechError = (e: any) => {
                        console.error('[Voice] Error:', e.error);
                        setError(e.error?.message || 'Speech recognition error');
                        setIsRecording(false);
                    };

                    console.log('[Voice] Event listeners set up');

                    // Check if Voice is available
                    try {
                        console.log('[Voice] Checking availability...');
                        const available = await Voice.isAvailable();
                        console.log('[Voice] Raw availability result:', available, typeof available);

                        const isVoiceAvailable = available === 1;
                        setIsAvailable(isVoiceAvailable);
                        console.log('[Voice] isVoiceAvailable:', isVoiceAvailable);

                        if (!isVoiceAvailable) {
                            console.warn('[Voice] Speech recognition not available on this device');
                            setError('Speech recognition not available. Please use a device with Google/Apple voice services.');
                        } else {
                            console.log('[Voice] Speech recognition is available!');
                        }
                    } catch (availError) {
                        console.error('[Voice] Error checking availability:', availError);
                        setIsAvailable(false);
                    }
                } catch (initError) {
                    console.error('[Voice] Initialization error:', initError);
                    setIsAvailable(false);
                    setError('Failed to initialize speech recognition');
                }
            }

            console.log('[Init] Initialization complete');
        };

        initializeVoice();

        return () => {
            console.log('[Cleanup] Cleaning up...');
            if (USE_WHISPER_API) {
                AudioRecord.stop().catch(e => console.log('Stop error:', e));
            } else {
                Voice.destroy().then(Voice.removeAllListeners).catch(e => console.log('Cleanup error:', e));
            }
        };
    }, []);

    const uploadAudioForTranscription = async (audioBase64: string): Promise<string> => {
        try {
            // Get auth token using authService
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            console.log('[STT] Starting audio upload, base64 length:', audioBase64.length);

            // Send base64 directly to backend instead of converting to blob
            // The backend will handle the base64 decoding
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/stt/transcribe`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    audio_base64: audioBase64,
                    language: 'en'
                }),
            });

            console.log('[STT] Response status:', response.status);

            const data = await response.json();

            if (!response.ok) {
                console.error('[STT ERROR] Transcription API error:', data);
                throw new Error(data.error || 'Transcription failed');
            }

            console.log('[STT] Transcription successful:', data.text);
            return data.text;
        } catch (err: any) {
            console.error('[STT ERROR] Error uploading audio:', err);
            throw err;
        }
    };

    const startRecording = async () => {
        console.log('[STT] startRecording called');
        console.log('[STT] hasPermissions:', hasPermissions);
        console.log('[STT] isAvailable:', isAvailable);
        console.log('[STT] isAudioRecordInitialized:', isAudioRecordInitialized);
        console.log('[STT] USE_WHISPER_API:', USE_WHISPER_API);

        // Check if AudioRecord is initialized (only for Whisper API mode)
        if (USE_WHISPER_API && !isAudioRecordInitialized) {
            setError('Audio recorder not initialized. Please restart the app or grant microphone permissions.');
            console.error('[STT] AudioRecord not initialized');
            return;
        }

        // Check if Voice is available (only for on-device mode)
        if (!USE_WHISPER_API && !isAvailable) {
            setError('Speech recognition is not available on this device. Please ensure Google/Apple voice services are installed.');
            return;
        }

        // Check if we have permissions
        if (!hasPermissions) {
            console.log('[STT] Requesting permissions...');
            const granted = await requestPermissions();
            console.log('[STT] Permission granted:', granted);

            if (!granted) {
                setError('Microphone permission is required for speech-to-text. Please enable it in app settings.');
                return;
            }
            setHasPermissions(true);

            // If permissions were just granted, initialize AudioRecord now
            if (USE_WHISPER_API && !isAudioRecordInitialized) {
                try {
                    console.log('[Whisper] Late initializing AudioRecord after permission grant...');
                    const options = {
                        sampleRate: 16000,
                        channels: 1,
                        bitsPerSample: 16,
                        audioSource: 6,
                        wavFile: 'recording.wav'
                    };
                    AudioRecord.init(options);
                    setIsAudioRecordInitialized(true);
                    console.log('[Whisper] AudioRecord initialized successfully (late init)');
                } catch (initError) {
                    console.error('[Whisper] Late AudioRecord initialization error:', initError);
                    setError('Failed to initialize audio recorder');
                    return;
                }
            }
        }

        try {
            // Reset accumulated transcript for new recording
            accumulatedTranscriptRef.current = '';

            // Reset audio level history for adaptive normalization
            audioLevelHistoryRef.current = [];

            // Don't clear transcript immediately - wait a bit so we can see streaming results
            setError(null);
            setAudioLevel(0);
            setTranscript('Listening...');

            if (USE_WHISPER_API) {
                // Use AudioRecord + Whisper API
                setIsRecording(true);
                AudioRecord.start();
                console.log('[Whisper] Recording started');
                console.log('[Whisper] Streaming enabled:', USE_DEEPGRAM_STREAMING);

                // Setup audio level monitoring with proper listener management
                setupAudioLevelListener();
            } else {
                // Use on-device Voice recognition
                console.log('[Voice] Starting recognition...');
                console.log('[Voice] Checking if Voice is ready...');

                // Double-check availability before starting
                try {
                    const available = await Voice.isAvailable();
                    console.log('[Voice] Availability check result:', available);

                    if (!available || available !== 1) {
                        throw new Error('Voice recognition service is not available on this device. Please install Google app or check your device settings.');
                    }
                } catch (availError: any) {
                    console.error('[Voice] Availability check failed:', availError);
                    throw new Error('Voice recognition service is not available. Please ensure Google app is installed and voice input is enabled in system settings.');
                }

                // Try to start Voice recognition
                try {
                    console.log('[Voice] Attempting to start with en-US...');
                    await Voice.start('en-US');
                    console.log('[Voice] Successfully started with en-US');
                    setIsRecording(true);
                } catch (voiceError: any) {
                    console.error('[Voice] Start error with language:', voiceError);
                    console.error('[Voice] Error code:', voiceError.code);
                    console.error('[Voice] Error message:', voiceError.message);

                    // Try with empty string as fallback (required parameter)
                    try {
                        console.log('[Voice] Attempting to start with empty locale...');
                        await Voice.start('');
                        console.log('[Voice] Successfully started with empty locale');
                        setIsRecording(true);
                    } catch (fallbackError: any) {
                        console.error('[Voice] Fallback start error:', fallbackError);
                        console.error('[Voice] Fallback error code:', fallbackError.code);
                        console.error('[Voice] Fallback error message:', fallbackError.message);

                        // Provide specific error message based on error code
                        if (fallbackError.code === '9' || fallbackError.message?.includes('Insufficient permissions')) {
                            throw new Error('Microphone permission denied. Please enable microphone access in app settings.');
                        } else if (fallbackError.code === '8' || fallbackError.message?.includes('not available')) {
                            throw new Error('Voice recognition service not available. Please install the Google app or enable voice input in system settings.');
                        } else {
                            throw new Error(`Voice recognition failed: ${fallbackError.message || 'Unknown error'}. Please rebuild the app (npm run android) to ensure native modules are linked.`);
                        }
                    }
                }
            }
        } catch (err: any) {
            console.error('[STT ERROR] Error starting recording:', err);
            setError(err.message || 'Failed to start recording');
            setIsRecording(false);
        }
    };

    const stopRecording = async (): Promise<string> => {
        try {
            if (USE_WHISPER_API) {
                // Cleanup silence detection timer
                if (silenceDetectionTimerRef.current) {
                    clearTimeout(silenceDetectionTimerRef.current);
                    silenceDetectionTimerRef.current = null;
                    console.log('[Audio] Silence timer cleared on stop');
                }

                // Cleanup audio level listener before stopping
                cleanupAudioLevelListener();

                // Flush any remaining buffered audio before stopping
                if (bufferTimeoutRef.current) {
                    clearTimeout(bufferTimeoutRef.current);
                    bufferTimeoutRef.current = null;
                }
                if (audioBufferRef.current && audioBufferRef.current.length > 0) {
                    console.log('[Whisper] Flushing remaining buffer before stop, size:', audioBufferRef.current.length);
                    await sendAudioChunkForTranscription(audioBufferRef.current);
                    audioBufferRef.current = '';
                }

                // Whisper API mode: stop AudioRecord and upload
                const audioFilePath = await AudioRecord.stop();
                setIsRecording(false);
                setAudioLevel(0);

                console.log('[Whisper] Recording stopped, file:', audioFilePath);

                if (!audioFilePath || audioFilePath.length === 0) {
                    throw new Error('No audio data recorded.');
                }

                const fileExists = await RNFS.exists(audioFilePath);
                if (!fileExists) {
                    throw new Error('Audio file not found');
                }

                const fileInfo = await RNFS.stat(audioFilePath);
                console.log('[Whisper] File size:', fileInfo.size, 'bytes');

                if (fileInfo.size === 0) {
                    throw new Error('No audio data recorded.');
                }

                const audioBase64 = await RNFS.readFile(audioFilePath, 'base64');
                console.log('[Whisper] Uploading to API...', audioBase64);
                const transcribedText = await uploadAudioForTranscription(audioBase64);

                // Reset accumulated transcript and set final result
                accumulatedTranscriptRef.current = '';
                setTranscript(transcribedText);

                // Clean up
                await RNFS.unlink(audioFilePath);

                return transcribedText;
            } else {
                // On-device Voice mode: just stop
                console.log('[Voice] Stopping recognition...');
                await Voice.stop();
                setIsRecording(false);
                // Transcript will be set by onSpeechResults callback
                // Return current transcript value
                return transcript;
            }
        } catch (err: any) {
            console.error('[STT ERROR] Error stopping recording:', err);
            setError(err.message || 'Failed to process recording');
            setIsRecording(false);
            return '';
        }
    };

    const cancelRecording = async () => {
        try {
            // Cleanup silence detection timer
            if (silenceDetectionTimerRef.current) {
                clearTimeout(silenceDetectionTimerRef.current);
                silenceDetectionTimerRef.current = null;
                console.log('[Audio] Silence timer cleared on cancel');
            }

            // Cleanup audio level listener
            cleanupAudioLevelListener();

            // Reset accumulated transcript
            accumulatedTranscriptRef.current = '';

            if (USE_WHISPER_API) {
                await AudioRecord.stop();
            } else {
                await Voice.cancel();
            }
            setTranscript('');
            setIsRecording(false);
            setAudioLevel(0);
            setError(null);
        } catch (err: any) {
            console.error('[STT ERROR] Error canceling recording:', err);
        }
    };

    /**
     * Set the callback for automatic recording stop after silence
     * Should be called before startRecording
     */
    const setAutoStopCallback = useCallback((callback: (() => Promise<void>) | null) => {
        autoStopCallbackRef.current = callback;
    }, []);

    return {
        isRecording,
        transcript,
        error,
        isAvailable,
        audioLevel,
        startRecording,
        stopRecording,
        cancelRecording,
        setAutoStopCallback,
    };
}
