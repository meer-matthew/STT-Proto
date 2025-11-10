import Sound from 'react-native-sound';
import RNFS from 'react-native-fs';
import { API_CONFIG } from '../config/api.config';
import { authService } from './authService';

// Enable playback in silent mode for iOS
Sound.setCategory('Playback');

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type Gender = 'male' | 'female' | 'other';

export interface TTSOptions {
    text: string;
    voice?: TTSVoice;
    gender?: Gender;
}

export interface VoiceInfo {
    id: TTSVoice;
    name: string;
    description: string;
}

class TTSService {
    private currentSound: Sound | null = null;
    private currentMessageId: string | null = null;

    /**
     * Map gender to appropriate TTS voice
     */
    private getVoiceForGender(gender?: Gender): TTSVoice {
        switch (gender) {
            case 'male':
                return 'onyx'; // Deep male voice
            case 'female':
                return 'nova'; // Female voice
            case 'other':
            default:
                return 'alloy'; // Neutral voice
        }
    }

    /**
     * Synthesize text to speech using OpenAI TTS API
     */
    async synthesizeSpeech(options: TTSOptions): Promise<string> {
        const { text, voice, gender } = options;

        // Determine which voice to use: explicit voice takes precedence, then gender-based selection, then default
        const selectedVoice = voice || this.getVoiceForGender(gender) || 'onyx';

        return new Promise(async (resolve, reject) => {
            try {
                console.log('[TTS] Synthesizing speech...');
                console.log('[TTS] Text length:', text.length);
                console.log('[TTS] Voice:', selectedVoice);
                console.log('[TTS] Gender:', gender);

                // Get auth token
                const token = await authService.getToken();
                if (!token) {
                    throw new Error('No authentication token found. Please log in again.');
                }

                // Use XMLHttpRequest for better binary data handling in React Native
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${API_CONFIG.BASE_URL}/api/tts/synthesize`);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.responseType = 'arraybuffer'; // Important for binary data

                xhr.onload = async () => {
                    try {
                        console.log('[TTS] Response status:', xhr.status);

                        if (xhr.status !== 200) {
                            reject(new Error(`Speech synthesis failed with status ${xhr.status}`));
                            return;
                        }

                        // Convert ArrayBuffer to base64
                        const arrayBuffer = xhr.response;
                        const bytes = new Uint8Array(arrayBuffer);
                        let binary = '';
                        for (let i = 0; i < bytes.length; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        const base64 = btoa(binary);
                        console.log('[TTS] Converted to base64, length:', base64.length);

                        // Save to temporary file
                        const tempFilePath = `${RNFS.CachesDirectoryPath}/tts_${Date.now()}.mp3`;
                        await RNFS.writeFile(tempFilePath, base64, 'base64');

                        // Verify file was created
                        const fileExists = await RNFS.exists(tempFilePath);
                        if (!fileExists) {
                            reject(new Error('Audio file was not created'));
                            return;
                        }

                        const fileInfo = await RNFS.stat(tempFilePath);
                        console.log('[TTS] Audio saved to:', tempFilePath);
                        console.log('[TTS] File size:', fileInfo.size, 'bytes');

                        if (fileInfo.size === 0) {
                            reject(new Error('Audio file is empty'));
                            return;
                        }

                        resolve(tempFilePath);
                    } catch (err) {
                        reject(err);
                    }
                };

                xhr.onerror = () => {
                    reject(new Error('Network error while fetching TTS audio'));
                };

                xhr.ontimeout = () => {
                    reject(new Error('TTS request timed out'));
                };

                // Send request with selected voice
                xhr.send(JSON.stringify({ text, voice: selectedVoice }));
            } catch (error: any) {
                console.error('[TTS ERROR] Speech synthesis failed:', error);
                reject(error);
            }
        });
    }

    /**
     * Play synthesized speech
     */
    async speak(text: string, messageId?: string, voice?: TTSVoice, gender?: Gender): Promise<void> {
        try {
            // Stop any currently playing audio
            await this.stop();

            // Store current message ID
            if (messageId) {
                this.currentMessageId = messageId;
            }

            console.log('[TTS] Starting playback for:', text.substring(0, 50) + '...');

            // Synthesize speech with gender support
            const audioFilePath = await this.synthesizeSpeech({ text, voice, gender });

            // Create sound instance
            return new Promise((resolve, reject) => {
                this.currentSound = new Sound(audioFilePath, '', (error) => {
                    if (error) {
                        console.error('[TTS ERROR] Failed to load sound:', error);
                        this.cleanup(audioFilePath);
                        reject(error);
                        return;
                    }

                    // Play the sound
                    this.currentSound?.play((success) => {
                        if (success) {
                            console.log('[TTS] Playback finished successfully');
                        } else {
                            console.error('[TTS ERROR] Playback failed');
                        }

                        // Cleanup
                        this.cleanup(audioFilePath);
                        resolve();
                    });
                });
            });
        } catch (error: any) {
            console.error('[TTS ERROR] Speak failed:', error);
            throw error;
        }
    }

    /**
     * Stop current playback
     */
    async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.currentSound) {
                console.log('[TTS] Stopping current playback');
                this.currentSound.stop(() => {
                    this.currentSound?.release();
                    this.currentSound = null;
                    this.currentMessageId = null;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Check if currently speaking
     */
    isSpeaking(): boolean {
        return this.currentSound !== null;
    }

    /**
     * Get current speaking message ID
     */
    getCurrentMessageId(): string | null {
        return this.currentMessageId;
    }

    /**
     * Get available voices
     */
    async getVoices(): Promise<VoiceInfo[]> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/api/tts/voices`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch voices');
            }

            const data = await response.json();
            return data.voices;
        } catch (error) {
            console.error('[TTS ERROR] Failed to get voices:', error);
            // Return default voices if API fails
            return [
                { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
                { id: 'echo', name: 'Echo', description: 'Male voice' },
                { id: 'fable', name: 'Fable', description: 'Warm and expressive' },
                { id: 'onyx', name: 'Onyx', description: 'Deep male voice' },
                { id: 'nova', name: 'Nova', description: 'Female voice' },
                { id: 'shimmer', name: 'Shimmer', description: 'Bright female voice' },
            ];
        }
    }

    /**
     * Cleanup audio file and sound instance
     */
    private async cleanup(filePath: string): Promise<void> {
        // Release sound
        if (this.currentSound) {
            this.currentSound.release();
            this.currentSound = null;
            this.currentMessageId = null;
        }

        // Delete temporary file
        try {
            const fileExists = await RNFS.exists(filePath);
            if (fileExists) {
                await RNFS.unlink(filePath);
                console.log('[TTS] Cleaned up audio file');
            }
        } catch (error) {
            console.warn('[TTS] Failed to cleanup audio file:', error);
        }
    }
}

// Export singleton instance
export const ttsService = new TTSService();
