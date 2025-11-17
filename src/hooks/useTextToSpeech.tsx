import { useState, useEffect } from 'react';
import { ttsService, TTSVoice, Gender } from '../services/ttsService';

/**
 * Text-to-Speech Hook using OpenAI TTS API
 *
 * This hook provides a high-quality text-to-speech solution using OpenAI's TTS API.
 * Benefits over on-device TTS:
 * - Consistent voice quality across all devices
 * - Professional, natural-sounding voices
 * - Better pronunciation and intonation
 *
 * Cost: ~$0.015 per 1,000 characters ($15/million)
 */
export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
    const [currentVoice, setCurrentVoice] = useState<TTSVoice>('onyx'); // Default voice - deep male voice
    const [volume, setVolume] = useState(0.85); // Default volume normalized to prevent clipping

    // Poll for speaking state
    useEffect(() => {
        const interval = setInterval(() => {
            const speaking = ttsService.isSpeaking();
            const speakingId = ttsService.getCurrentMessageId();

            setIsSpeaking(speaking);
            setCurrentlySpeakingId(speakingId);
        }, 100);

        return () => {
            clearInterval(interval);
            ttsService.stop();
        };
    }, []);

    const speak = async (text: string, messageId?: string, gender?: Gender) => {
        try {
            console.log('[TTS Hook] Speaking:', text.substring(0, 50) + '...');
            console.log('[TTS Hook] Gender:', gender);
            setIsSpeaking(true);

            if (messageId) {
                setCurrentlySpeakingId(messageId);
            }

            // Use gender-based voice selection if gender is provided, otherwise use currentVoice
            const voiceToUse = gender ? undefined : currentVoice;
            await ttsService.speak(text, messageId, voiceToUse, gender);

            // Update state after speaking completes
            setIsSpeaking(false);
            setCurrentlySpeakingId(null);
        } catch (error) {
            console.error('[TTS Hook] Error:', error);
            setIsSpeaking(false);
            setCurrentlySpeakingId(null);
        }
    };

    const stop = async () => {
        try {
            await ttsService.stop();
            setIsSpeaking(false);
            setCurrentlySpeakingId(null);
        } catch (error) {
            console.error('[TTS Hook] Stop Error:', error);
        }
    };

    const getAvailableVoices = async () => {
        try {
            const voices = await ttsService.getVoices();
            return voices;
        } catch (error) {
            console.error('[TTS Hook] Error getting voices:', error);
            return [];
        }
    };

    const setVoice = (voiceId: TTSVoice) => {
        setCurrentVoice(voiceId);
        console.log('[TTS Hook] Voice changed to:', voiceId);
    };

    // These functions are kept for compatibility but have no effect with OpenAI TTS
    // (OpenAI TTS doesn't support rate/pitch adjustment)
    const setRate = (rate: number) => {
        console.log('[TTS Hook] Rate adjustment not supported with OpenAI TTS');
    };

    const setPitch = (pitch: number) => {
        console.log('[TTS Hook] Pitch adjustment not supported with OpenAI TTS');
    };

    /**
     * Set playback volume (0.0 to 1.0)
     * Default: 0.85 (normalized to prevent clipping)
     * Recommended range: 0.7 - 1.0
     */
    const setAudioVolume = (newVolume: number) => {
        // Clamp volume between 0.0 and 1.0
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        setVolume(clampedVolume);
        console.log('[TTS Hook] Volume set to:', clampedVolume);
    };

    return {
        speak,
        stop,
        isSpeaking,
        currentlySpeakingId,
        setRate,
        setPitch,
        setAudioVolume,
        getAvailableVoices,
        setVoice,
        currentVoice,
        volume,
    };
}
