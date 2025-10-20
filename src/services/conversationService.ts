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
    message: string;
    has_audio: boolean;
    audio_url?: string;
    created_at: string;
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
                throw new Error(data.error || 'Failed to fetch conversations');
            }

            return data.conversations;
        } catch (error) {
            console.error('Get conversations error:', error);
            throw error;
        }
    }

    /**
     * Create a new conversation
     */
    async createConversation(configuration: string = '1:1'): Promise<ApiConversation> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ configuration }),
            });

            const data = await response.json();

            if (!response.ok) {
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
        hasAudio: boolean = false
    ): Promise<ApiMessage> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_URL}/${conversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    sender_type: senderType,
                    has_audio: hasAudio,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
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
                throw new Error(data.error || 'Failed to fetch messages');
            }

            return data.messages;
        } catch (error) {
            console.error('Get messages error:', error);
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
                throw new Error(data.error || 'Failed to remove participant');
            }
        } catch (error) {
            console.error('Remove participant error:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const conversationService = new ConversationService();