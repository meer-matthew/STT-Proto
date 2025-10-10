import { useState, useEffect } from 'react';
import Tts from 'react-native-tts';

export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

    useEffect(() => {
        // Initialize TTS
        const initTts = async () => {
            try {
                // Set default language if method exists
                if (Tts.setDefaultLanguage) {
                    await Tts.setDefaultLanguage('en-US');
                }

                // Set default rate and pitch
                if (Tts.setDefaultRate) {
                    Tts.setDefaultRate(0.5);
                }

                if (Tts.setDefaultPitch) {
                    Tts.setDefaultPitch(1.0);
                }
            } catch (error) {
                console.log('TTS initialization error:', error);
            }
        };

        initTts();

        // Set up event listeners
        Tts.addEventListener('tts-start', () => {
            setIsSpeaking(true);
        });

        Tts.addEventListener('tts-finish', () => {
            setIsSpeaking(false);
            setCurrentlySpeakingId(null);
        });

        Tts.addEventListener('tts-cancel', () => {
            setIsSpeaking(false);
            setCurrentlySpeakingId(null);
        });

        // Cleanup
        return () => {
            Tts.removeAllListeners('tts-start');
            Tts.removeAllListeners('tts-finish');
            Tts.removeAllListeners('tts-cancel');
            Tts.stop();
        };
    }, []);

    const speak = async (text: string, messageId?: string) => {
        try {
            // If already speaking, stop first
            if (isSpeaking) {
                await Tts.stop();
            }

            if (messageId) {
                setCurrentlySpeakingId(messageId);
            }

            await Tts.speak(text);
        } catch (error) {
            console.error('TTS Error:', error);
            setIsSpeaking(false);
            setCurrentlySpeakingId(null);
        }
    };

    const stop = async () => {
        try {
            await Tts.stop();
            setIsSpeaking(false);
            setCurrentlySpeakingId(null);
        } catch (error) {
            console.error('TTS Stop Error:', error);
        }
    };

    const setRate = (rate: number) => {
        // Rate should be between 0.01 and 0.99
        const normalizedRate = Math.max(0.01, Math.min(0.99, rate));
        Tts.setDefaultRate(normalizedRate);
    };

    const setPitch = (pitch: number) => {
        // Pitch should be between 0.5 and 2.0
        const normalizedPitch = Math.max(0.5, Math.min(2.0, pitch));
        Tts.setDefaultPitch(normalizedPitch);
    };

    const getAvailableVoices = async () => {
        try {
            const voices = await Tts.voices();
            return voices;
        } catch (error) {
            console.error('Error getting voices:', error);
            return [];
        }
    };

    const setVoice = (voiceId: string) => {
        Tts.setDefaultVoice(voiceId);
    };

    return {
        speak,
        stop,
        isSpeaking,
        currentlySpeakingId,
        setRate,
        setPitch,
        getAvailableVoices,
        setVoice,
    };
}
