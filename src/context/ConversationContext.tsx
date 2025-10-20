import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { conversationService, ApiConversation } from '../services/conversationService';

export type Message = {
    id: string;
    sender: string;
    senderType: 'user' | 'caregiver';
    message: string;
    timestamp: Date;
    hasAudio?: boolean;
};

export type Conversation = {
    id: string;
    username: string;
    configuration: string;
    createdAt: Date;
    messages: Message[];
};

type ConversationContextType = {
    conversations: Map<string, Conversation>;
    currentConversationId: string | null;
    isLoading: boolean;
    createConversation: (username: string, configuration: string) => Promise<string>;
    setCurrentConversation: (id: string) => Promise<void>;
    getCurrentConversation: () => Conversation | null;
    addMessage: (conversationId: string, sender: string, senderType: 'user' | 'caregiver', message: string, hasAudio?: boolean) => string | null;
    getMessages: (conversationId: string) => Message[];
    clearConversation: (conversationId: string) => void;
    fetchUserConversations: () => Promise<void>;
};

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
    const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchUserConversations = async () => {
        setIsLoading(true);
        try {
            const apiConversations = await conversationService.getUserConversations();

            // Convert API conversations to local format
            const conversationsMap = new Map<string, Conversation>();
            apiConversations.forEach((apiConv) => {
                const conversation: Conversation = {
                    id: String(apiConv.id),
                    username: apiConv.username,
                    configuration: apiConv.configuration,
                    createdAt: new Date(apiConv.created_at),
                    messages: [], // Messages will be loaded separately when conversation is selected
                };
                conversationsMap.set(String(apiConv.id), conversation);
            });

            setConversations(conversationsMap);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createConversation = async (username: string, configuration: string): Promise<string> => {
        try {
            const apiConversation = await conversationService.createConversation(configuration);

            const newConversation: Conversation = {
                id: String(apiConversation.id),
                username: apiConversation.username,
                configuration: apiConversation.configuration,
                createdAt: new Date(apiConversation.created_at),
                messages: [],
            };

            setConversations(prev => new Map(prev).set(String(apiConversation.id), newConversation));
            setCurrentConversationId(String(apiConversation.id));
            return String(apiConversation.id);
        } catch (error) {
            console.error('Failed to create conversation:', error);
            throw error;
        }
    };

    const setCurrentConversation = async (id: string) => {
        if (conversations.has(id)) {
            setCurrentConversationId(id);

            // Load messages for this conversation from backend
            try {
                const apiMessages = await conversationService.getMessages(Number(id));

                // Convert API messages to local format
                const messages: Message[] = apiMessages.map(apiMsg => ({
                    id: String(apiMsg.id),
                    sender: apiMsg.sender,
                    senderType: apiMsg.sender_type,
                    message: apiMsg.message,
                    timestamp: new Date(apiMsg.created_at),
                    hasAudio: apiMsg.has_audio,
                }));

                // Update conversation with loaded messages
                setConversations(prev => {
                    const conv = prev.get(id);
                    if (!conv) return prev;

                    return new Map(prev).set(id, {
                        ...conv,
                        messages,
                    });
                });
            } catch (error) {
                console.error('Failed to load messages:', error);
            }
        }
    };

    const getCurrentConversation = (): Conversation | null => {
        if (!currentConversationId) return null;
        return conversations.get(currentConversationId) || null;
    };

    const addMessage = (
        conversationId: string,
        sender: string,
        senderType: 'user' | 'caregiver',
        message: string,
        hasAudio: boolean = false
    ): string | null => {
        const conversation = conversations.get(conversationId);
        if (!conversation) return null;

        // Create temporary message ID for immediate UI update
        const tempMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const newMessage: Message = {
            id: tempMessageId,
            sender,
            senderType,
            message,
            timestamp: new Date(),
            hasAudio,
        };

        // Optimistically update UI first
        const updatedConversation = {
            ...conversation,
            messages: [...conversation.messages, newMessage],
        };

        setConversations(prev => new Map(prev).set(conversationId, updatedConversation));

        // Send message to backend asynchronously
        const saveMessageToBackend = async () => {
            try {
                const apiMessage = await conversationService.sendMessage(
                    Number(conversationId),
                    message,
                    senderType,
                    hasAudio
                );

                // Update message with backend ID and timestamp
                const backendMessage: Message = {
                    id: String(apiMessage.id),
                    sender: apiMessage.sender,
                    senderType: apiMessage.sender_type,
                    message: apiMessage.message,
                    timestamp: new Date(apiMessage.created_at),
                    hasAudio: apiMessage.has_audio,
                };

                // Replace temp message with backend message
                setConversations(prev => {
                    const conv = prev.get(conversationId);
                    if (!conv) return prev;

                    const updatedMessages = conv.messages.map(msg =>
                        msg.id === tempMessageId ? backendMessage : msg
                    );

                    return new Map(prev).set(conversationId, {
                        ...conv,
                        messages: updatedMessages,
                    });
                });
            } catch (error) {
                console.error('Failed to save message to backend:', error);
                // Message stays in UI with temp ID, could add error indicator here
            }
        };

        saveMessageToBackend();

        // Return the message ID so TTS can be triggered
        return tempMessageId;
    };

    const getMessages = (conversationId: string): Message[] => {
        const conversation = conversations.get(conversationId);
        return conversation?.messages || [];
    };

    const clearConversation = (conversationId: string) => {
        const conversation = conversations.get(conversationId);
        if (!conversation) return;

        const clearedConversation = {
            ...conversation,
            messages: [],
        };

        setConversations(prev => new Map(prev).set(conversationId, clearedConversation));
    };

    return (
        <ConversationContext.Provider
            value={{
                conversations,
                currentConversationId,
                isLoading,
                createConversation,
                setCurrentConversation,
                getCurrentConversation,
                addMessage,
                getMessages,
                clearConversation,
                fetchUserConversations,
            }}>
            {children}
        </ConversationContext.Provider>
    );
}

export function useConversation() {
    const context = useContext(ConversationContext);
    if (!context) {
        throw new Error('useConversation must be used within ConversationProvider');
    }
    return context;
}