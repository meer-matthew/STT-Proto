import { useEffect, useState } from 'react';
import Voice, {
    SpeechResultsEvent,
    SpeechErrorEvent,
    SpeechVolumeChangeEvent,
} from '@react-native-voice/voice';
import { Platform, PermissionsAndroid } from 'react-native';

export function useSpeechToText() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isAvailable, setIsAvailable] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);

    useEffect(() => {
        // Check if speech recognition is available
        Voice.isAvailable()
            .then((available) => {
                setIsAvailable(available === 1);
            })
            .catch(() => {
                setIsAvailable(false);
            });

        // Set up event listeners
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechPartialResults = onSpeechPartialResults;
        Voice.onSpeechError = onSpeechError;
        Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;

        return () => {
            // Clean up
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    const onSpeechStart = () => {
        setIsRecording(true);
        setError(null);
    };

    const onSpeechEnd = () => {
        setIsRecording(false);
    };

    const onSpeechResults = (event: SpeechResultsEvent) => {
        if (event.value && event.value.length > 0) {
            setTranscript(event.value[0]);
        }
    };

    const onSpeechPartialResults = (event: SpeechResultsEvent) => {
        if (event.value && event.value.length > 0) {
            setTranscript(event.value[0]);
        }
    };

    const onSpeechError = (event: SpeechErrorEvent) => {
        setError(event.error?.message || 'Speech recognition error');
        setIsRecording(false);
        setAudioLevel(0);
    };

    const onSpeechVolumeChanged = (event: SpeechVolumeChangeEvent) => {
        // Volume comes as a value typically between -2 and 10
        // Normalize it to 0-10 scale
        if (event.value !== undefined) {
            const normalized = Math.max(0, Math.min(10, event.value + 2));
            setAudioLevel(normalized);
        }
    };

    const requestMicrophonePermission = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'This app needs access to your microphone for speech-to-text',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true; // iOS permissions handled via Info.plist
    };

    const startRecording = async () => {
        console.log('Starting recording...');
        setTranscript('');
        setError(null);

        // Check if Voice is available
        if (!isAvailable) {
            setError('Speech recognition is not available');
            console.error('Speech recognition is not available');
            return;
        }

        const hasPermission = await requestMicrophonePermission();
        console.log('Microphone permission:', hasPermission);

        if (!hasPermission) {
            setError('Microphone permission denied');
            console.error('Microphone permission denied');
            return;
        }

        try {
            // Stop any ongoing recording first
            await Voice.stop();
            await Voice.cancel();

            console.log('Calling Voice.start...');
            await Voice.start('en-US'); // You can change the language code
            console.log('Voice.start called successfully');
            setIsRecording(true);
        } catch (err) {
            setError('Failed to start recording');
            console.error('Error starting recording:', err);
        }
    };

    const stopRecording = async () => {
        try {
            await Voice.stop();
        } catch (err) {
            setError('Failed to stop recording');
            console.error(err);
        }
    };

    const cancelRecording = async () => {
        try {
            await Voice.cancel();
            setTranscript('');
            setIsRecording(false);
        } catch (err) {
            console.error(err);
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