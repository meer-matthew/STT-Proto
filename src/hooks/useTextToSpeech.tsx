import { useState, useEffect } from 'react';
import Tts from 'react-native-tts';
import { Platform } from 'react-native';

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

                // Get available voices and select the best one
                try {
                    const voices = await Tts.voices();
                    console.log('Available voices:', voices);

                    // Find the best quality voice based on platform
                    let bestVoice = null;

                    if (Platform.OS === 'ios') {
                        // Prioritize enhanced/premium iOS voices
                        // Look for: Enhanced, Premium, Siri, or neural voices
                        const priorityPatterns = [
                            /enhanced/i,
                            /premium/i,
                            /siri/i,
                            /neural/i,
                            /(samantha|alex|karen|daniel|moira|fiona)/i, // High-quality iOS voices
                        ];

                        for (const pattern of priorityPatterns) {
                            bestVoice = voices.find((v: any) =>
                                pattern.test(v.name) && v.language.startsWith('en-')
                            );
                            if (bestVoice) break;
                        }
                    } else if (Platform.OS === 'android') {
                        // Prioritize Google neural voices on Android
                        const priorityPatterns = [
                            /neural/i,
                            /wavenet/i,
                            /google/i,
                            /en-us-x/i, // Google's high-quality voices
                        ];

                        for (const pattern of priorityPatterns) {
                            bestVoice = voices.find((v: any) =>
                                pattern.test(v.name || v.id) && v.language.startsWith('en-')
                            );
                            if (bestVoice) break;
                        }
                    }

                    // Fallback to first English voice if no premium voice found
                    if (!bestVoice) {
                        bestVoice = voices.find((v: any) => v.language.startsWith('en-'));
                    }

                    if (bestVoice) {
                        console.log('Selected voice:', bestVoice);
                        // Use voice ID for Android, name for iOS
                        const voiceId = bestVoice.id || bestVoice.name;
                        if (voiceId) {
                            Tts.setDefaultVoice(voiceId);
                        }
                    }
                } catch (voiceError) {
                    console.log('Voice selection error:', voiceError);
                }

                // Set improved rate and pitch for more natural speech
                if (Tts.setDefaultRate) {
                    // Slightly faster than default for more natural conversation
                    Tts.setDefaultRate(0.55, true);
                }

                if (Tts.setDefaultPitch) {
                    // Slightly higher pitch for friendlier tone
                    Tts.setDefaultPitch(1.1);
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
