import { useEffect, useState, useCallback } from 'react';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

export function useSpeechToText() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0); // Not available for device-based recognition

    const onSpeechStart = useCallback(() => {
        console.log('Speech recognition started');
        setError(null);
    }, []);

    const onSpeechEnd = useCallback(() => {
        console.log('Speech recognition ended');
        setIsRecording(false);
    }, []);

    const onSpeechResults = useCallback((event: SpeechResultsEvent) => {
        if (event.value && event.value.length > 0) {
            const recognizedText = event.value[0];
            console.log('Speech recognized:', recognizedText);
            setTranscript(recognizedText);
        }
    }, []);

    const onSpeechError = useCallback((event: SpeechErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setError(event.error?.message || 'Speech recognition failed');
        setIsRecording(false);
    }, []);

    useEffect(() => {
        // Check if speech recognition is available
        Voice.isAvailable().then((available) => {
            setIsAvailable(available === 1);
        });

        // Set up event listeners
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechError = onSpeechError;

        return () => {
            // Clean up
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, [onSpeechStart, onSpeechEnd, onSpeechResults, onSpeechError]);

    const startRecording = async () => {
        if (!isAvailable) {
            setError('Speech recognition is not available on this device');
            return;
        }

        try {
            setTranscript('');
            setError(null);
            await Voice.start('en-US');
            setIsRecording(true);
        } catch (err: any) {
            console.error('Error starting speech recognition:', err);
            setError(err.message || 'Failed to start speech recognition');
            setIsRecording(false);
        }
    };

    const stopRecording = async () => {
        try {
            await Voice.stop();
            setIsRecording(false);
        } catch (err: any) {
            console.error('Error stopping speech recognition:', err);
            setError(err.message || 'Failed to stop speech recognition');
            setIsRecording(false);
        }
    };

    const cancelRecording = async () => {
        try {
            await Voice.cancel();
            setTranscript('');
            setIsRecording(false);
            setError(null);
        } catch (err: any) {
            console.error('Error canceling speech recognition:', err);
        }
    };

    return {
        isRecording,
        transcript,
        error,
        isAvailable,
        audioLevel,
        startRecording,
        stopRecording,
        cancelRecording,
    };
}
