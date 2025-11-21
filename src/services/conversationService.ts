import { API_CONFIG } from '../config/api.config';
import { authService } from './authService';

const API_URL = `${API_CONFIG.BASE_URL}/api/conversations`;

export interface ApiConversation {
    id: number;
    user_id: number;
    username: string;
    configuration: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    message_count: number;
}

export interface ApiMessage {
    id: number;
    conversation_id: number;
    sender: string;
    sender_type: 'user' | 'caregiver';
    sender_gender?: 'male' | 'female' | 'other'; // For TTS voice selection
    message: string;
    has_audio: boolean;
    audio_url?: string;
    created_at: string;
}

export interface StreamEvent {
    type: 'start' | 'chunk' | 'complete';
    message_id?: number;
    text?: string;
    accumulated_text?: string;
    message?: ApiMessage;
}

export interface ApiParticipant {
    id: number;
    conversation_id: number;
    user_id: number;
    username: string;
    user_type: 'user' | 'caretaker';
    added_at: string;
    added_by?: number;
}

export interface ApiUser {
    id: number;
    username: string;
    email: string;
    gender?: string;
    img_url?: string;
    is_active: boolean;
}

export interface ApiParticipantWithUser extends ApiParticipant {
    user: ApiUser | null;
}

export interface ApiConversationWithDetails extends ApiConversation {
    participants: ApiParticipantWithUser[];
    messages: ApiMessage[];
}

class ConversationService {
    /**
     * Get all conversations for the current user
     */
    async getUserConversations(): Promise<ApiConversation[]> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401) {
                    await authService.clearAuth();
                    throw new Error('Authentication expired');
                }
                throw new Error(data.error || 'Failed to fetch conversations');
            }

            return data.conversations;
        } catch (error) {
            console.error('Get conversations error:', error);
            throw error;
        }
    }

    /**
     * Get all conversations with participants and messages in one call
     * This avoids needing to make separate API calls for participants and messages
     */
    async getUserConversationsWithDetails(): Promise<ApiConversationWithDetails[]> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_URL}/with-details`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401) {
                    await authService.clearAuth();
                    throw new Error('Authentication expired');
                }
                throw new Error(data.error || 'Failed to fetch conversations with details');
            }

            return data.conversations;
        } catch (error) {
            console.error('Get conversations with details error:', error);
            throw error;
        }
    }

    /**
     * Create a new conversation
     *
     * @param configuration - Conversation configuration (default: '1:1')
     * @param participantIds - Optional list of user IDs to add as participants
     */
    async createConversation(configuration: string = '1:1', participantIds?: number[]): Promise<ApiConversation> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const body: any = { configuration };
            if (participantIds && participantIds.length > 0) {
                body.participant_ids = participantIds;
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401) {
                    await authService.clearAuth();
                    throw new Error('Authentication expired');
                }
                throw new Error(data.error || 'Failed to create conversation');
            }

            return data;
        } catch (error) {
            console.error('Create conversation error:', error);
            throw error;
        }
    }

    /**
     * Get a specific conversation with messages
     */
    async getConversation(conversationId: number): Promise<ApiConversation & { messages: ApiMessage[] }> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_URL}/${conversationId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401) {
                    await authService.clearAuth();
                    throw new Error('Authentication expired');
                }
                throw new Error(data.error || 'Failed to fetch conversation');
            }

            return data;
        } catch (error) {
            console.error('Get conversation error:', error);
            throw error;
        }
    }

    /**
     * Send a message in a conversation
     */
    async sendMessage(
        conversationId: number,
        message: string,
        senderType: 'user' | 'caregiver' = 'user',
        hasAudio: boolean = false,
        senderGender?: 'male' | 'female' | 'other'
    ): Promise<ApiMessage> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const body: any = {
                message,
                sender_type: senderType,
                has_audio: hasAudio,
            };

            // Include sender gender if provided (for TTS voice selection)
            if (senderGender) {
                body.sender_gender = senderGender;
            }

            const response = await fetch(`${API_URL}/${conversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401) {
                    await authService.clearAuth();
                    throw new Error('Authentication expired');
                }
                throw new Error(data.error || 'Failed to send message');
            }

            return data;
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    }

    /**
     * Get all messages for a conversation
     */
    async getMessages(conversationId: number): Promise<ApiMessage[]> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_URL}/${conversationId}/messages`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401) {
                    await authService.clearAuth();
                    throw new Error('Authentication expired');
                }
                throw new Error(data.error || 'Failed to fetch messages');
            }

            return data.messages;
        } catch (error: any) {
            console.error('[ConversationService] Get messages error:', {
                message: error?.message,
                code: error?.code,
                conversationId
            });
            throw error;
        }
    }

    /**
     * Get all participants for a conversation
     */
    async getParticipants(conversationId: number): Promise<ApiParticipant[]> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_URL}/${conversationId}/participants`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401) {
                    await authService.clearAuth();
                    throw new Error('Authentication expired');
                }
                throw new Error(data.error || 'Failed to fetch participants');
            }

            return data.participants;
        } catch (error) {
            console.error('Get participants error:', error);
            throw error;
        }
    }

    /**
     * Add a participant to a conversation
     */
    async addParticipant(conversationId: number, userId: number): Promise<ApiParticipant> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_URL}/${conversationId}/participants`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401) {
                    await authService.clearAuth();
                    throw new Error('Authentication expired');
                }
                throw new Error(data.error || 'Failed to add participant');
            }

            return data;
        } catch (error) {
            console.error('Add participant error:', error);
            throw error;
        }
    }

    /**
     * Remove a participant from a conversation
     */
    async removeParticipant(conversationId: number, userId: number): Promise<void> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_URL}/${conversationId}/participants/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401) {
                    await authService.clearAuth();
                    throw new Error('Authentication expired');
                }
                throw new Error(data.error || 'Failed to remove participant');
            }
        } catch (error) {
            console.error('Remove participant error:', error);
            throw error;
        }
    }

    /**
     * Send a message and stream the response in real-time using Server-Sent Events
     * This sends a message to all participants in a conversation immediately
     * Other participants receive it via the polling mechanism or SSE connection
     */
    async sendMessageWithStream(
        conversationId: number,
        message: string,
        senderType: 'user' | 'caregiver' = 'user',
        hasAudio: boolean = false,
        onChunk: (event: StreamEvent) => void,
        onError?: (error: Error) => void,
        senderGender?: 'male' | 'female' | 'other'
    ): Promise<ApiMessage | null> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('[Message Stream] Starting SSE stream for message:', message.substring(0, 50));

            const body: any = {
                message,
                sender_type: senderType,
                has_audio: hasAudio,
            };

            // Include sender gender if provided (for TTS voice selection)
            if (senderGender) {
                body.sender_gender = senderGender;
            }

            const response = await fetch(`${API_URL}/${conversationId}/messages/stream`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const data = await response.json();
                if (response.status === 401) {
                    await authService.clearAuth();
                    throw new Error('Authentication expired');
                }
                throw new Error(data.error || 'Failed to send message with stream');
            }

            // Read the response body as text
            // Note: React Native doesn't support ReadableStream.getReader(), so we read as text
            const responseText = await response.text();
            let finalMessage: ApiMessage | null = null;

            // Parse the server-sent events
            const lines = responseText.split('\n');

            for (const line of lines) {
                const trimmedLine = line.trim();

                if (trimmedLine === '' || trimmedLine === ':') continue;
                if (trimmedLine === '[DONE]') break;

                // Remove "data: " prefix if present
                if (trimmedLine.startsWith('data: ')) {
                    const dataStr = trimmedLine.substring(6);
                    try {
                        const event = JSON.parse(dataStr) as StreamEvent;
                        console.log('[Message Stream] Event received:', event.type);
                        onChunk(event);

                        // Store final message
                        if (event.type === 'complete' && event.message) {
                            finalMessage = event.message;
                        }
                    } catch (e) {
                        console.warn('[Message Stream] Failed to parse event:', trimmedLine, e);
                    }
                }
            }

            console.log('[Message Stream] Stream completed');
            return finalMessage;
        } catch (error) {
            console.error('Send message with stream error:', error);
            if (onError) {
                onError(error as Error);
            }
            return null;
        }
    }

    /**
     * Stream messages from a conversation using polling (React Native compatible)
     * Polls for new messages every 1 second for faster real-time updates
     * Returns a cleanup function to close the connection
     */
    async streamMessages(
        conversationId: number,
        onMessage: (message: ApiMessage) => void,
        onError?: (error: Error) => void
    ): Promise<() => void> {
        try {
            // const token = await authService.getToken();
            // if (!token) {
            //     throw new Error('No authentication token found');
            // }
            //
            // console.log('[Messages Stream] Starting polling for conversation:', conversationId);

            let lastMessageId = 0;
            let pollInterval: NodeJS.Timeout | null = null;
            let isClosed = false;

            // Fetch initial messages to know the last message ID
            try {
                const initialMessages = await this.getMessages(conversationId);
                if (initialMessages.length > 0) {
                    lastMessageId = initialMessages[initialMessages.length - 1].id;
                }
                console.log('[Messages Stream] Initial last message ID:', lastMessageId);
            } catch (e) {
                console.warn('[Messages Stream] Failed to fetch initial messages:', e);
            }

            // Poll for new messages every 1 second for better real-time feel
            const poll = async () => {
                if (isClosed) return;

                try {
                    const messages = await this.getMessages(conversationId);

                    // Check if stream was closed while request was in flight
                    if (isClosed) return;

                    // Find new messages (those with ID greater than lastMessageId)
                    const newMessages = messages.filter(msg => msg.id > lastMessageId);

                    if (newMessages.length > 0) {
                        console.log('[Messages Stream] Found', newMessages.length, 'new messages');
                        // Update last message ID
                        lastMessageId = newMessages[newMessages.length - 1].id;

                        // Call onMessage callback for each new message
                        newMessages.forEach(msg => {
                            console.log('[Messages Stream] Message received:', msg);
                            onMessage(msg);
                        });
                    }
                } catch (error: any) {
                    // Don't report errors if stream is already closed (component unmounted)
                    if (isClosed) return;

                    console.error('[Messages Stream] Polling error:', {
                        message: error?.message,
                        code: error?.code,
                        status: error?.status,
                        type: error?.constructor?.name
                    });
                    if (onError) {
                        onError(error as Error);
                    }
                }

                // Schedule next poll
                if (!isClosed) {
                    pollInterval = setTimeout(poll, 1000); // Poll every 1 second for faster updates
                }
            };

            // Start polling immediately
            pollInterval = setTimeout(poll, 0);

            console.log('[Messages Stream] Polling started');

            // Return cleanup function
            return () => {
                console.log('[Messages Stream] Closing polling');
                isClosed = true;
                if (pollInterval) {
                    clearTimeout(pollInterval);
                }
            };
        } catch (error) {
            console.error('Stream messages error:', error);
            if (onError) {
                onError(error as Error);
            }
            // Return no-op cleanup function
            return () => {};
        }
    }
}

// Export singleton instance
export const conversationService = new ConversationService();