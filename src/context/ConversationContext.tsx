import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { conversationService, ApiConversation, ApiConversationWithDetails, StreamEvent } from '../services/conversationService';

export type Message = {
    id: string;
    sender: string;
    senderType: 'user' | 'caregiver';
    message: string;
    timestamp: Date;
    hasAudio?: boolean;
    isStreaming?: boolean; // Indicates if message is currently streaming
    accumulatedText?: string; // Text accumulated during streaming
    sender_gender?: 'male' | 'female' | 'other'; // Sender's gender for TTS voice selection
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
    loadConversation: (id: string) => Promise<void>;
    setCurrentConversation: (id: string) => Promise<void>;
    getCurrentConversation: () => Conversation | null;
    addMessage: (conversationId: string, sender: string, senderType: 'user' | 'caregiver', message: string, hasAudio?: boolean) => string | null;
    addMessageWithStream: (conversationId: string, sender: string, senderType: 'user' | 'caregiver', message: string, hasAudio?: boolean, senderGender?: 'male' | 'female' | 'other') => Promise<string | null>;
    addReceivedMessage: (conversationId: string, apiMessage: any) => void;
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
            // Fetch conversations with all details (participants and messages) in one call
            const apiConversations = await conversationService.getUserConversationsWithDetails();

            // Convert API conversations to local format
            const conversationsMap = new Map<string, Conversation>();
            apiConversations.forEach((apiConv) => {
                // Convert API messages to local format
                const messages: Message[] = (apiConv.messages || []).map(apiMsg => ({
                    id: String(apiMsg.id),
                    sender: apiMsg.sender,
                    senderType: apiMsg.sender_type,
                    message: apiMsg.message,
                    timestamp: new Date(apiMsg.created_at),
                    hasAudio: apiMsg.has_audio,
                    sender_gender: apiMsg.sender_gender,
                }));

                const conversation: Conversation = {
                    id: String(apiConv.id),
                    username: apiConv.username,
                    configuration: apiConv.configuration,
                    createdAt: new Date(apiConv.created_at),
                    messages, // Now we have all messages from the API response
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

    const loadConversation = async (id: string): Promise<void> => {
        try {
            // Fetch conversation details from backend
            const apiConversation = await conversationService.getConversation(Number(id));

            // Fetch messages for this conversation
            const apiMessages = await conversationService.getMessages(Number(id));

            // Convert API messages to local format
            const messages: Message[] = apiMessages.map(apiMsg => ({
                id: String(apiMsg.id),
                sender: apiMsg.sender,
                senderType: apiMsg.sender_type,
                message: apiMsg.message,
                timestamp: new Date(apiMsg.created_at),
                hasAudio: apiMsg.has_audio,
                sender_gender: apiMsg.sender_gender,
            }));

            // Create conversation object
            const conversation: Conversation = {
                id: String(apiConversation.id),
                username: apiConversation.username,
                configuration: apiConversation.configuration,
                createdAt: new Date(apiConversation.created_at),
                messages,
            };

            // Add to conversations map and set as current
            setConversations(prev => new Map(prev).set(id, conversation));
            setCurrentConversationId(id);
        } catch (error) {
            console.error('Failed to load conversation:', error);
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
                    sender_gender: apiMsg.sender_gender,
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
        hasAudio: boolean = false,
        senderGender?: 'male' | 'female' | 'other'
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
            sender_gender: senderGender,
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
                    sender_gender: apiMessage.sender_gender,
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

    const addMessageWithStream = async (
        conversationId: string,
        sender: string,
        senderType: 'user' | 'caregiver',
        message: string,
        hasAudio: boolean = false,
        senderGender?: 'male' | 'female' | 'other'
    ): Promise<string | null> => {
        const conversation = conversations.get(conversationId);
        if (!conversation) return null;

        // Create temporary message ID for immediate UI update
        const tempMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const newMessage: Message = {
            id: tempMessageId,
            sender,
            senderType,
            message: '', // Will be populated by stream
            timestamp: new Date(),
            hasAudio,
            isStreaming: true,
            accumulatedText: '',
        };

        // Optimistically update UI with empty streaming message
        const updatedConversation = {
            ...conversation,
            messages: [...conversation.messages, newMessage],
        };

        setConversations(prev => new Map(prev).set(conversationId, updatedConversation));

        // Send message and stream response
        try {
            const finalMessage = await conversationService.sendMessageWithStream(
                Number(conversationId),
                message,
                senderType,
                hasAudio,
                (event: StreamEvent) => {
                    // Handle streaming events
                    if (event.type === 'start') {
                        console.log('[Context] Stream started for message:', event.message_id);
                    } else if (event.type === 'chunk') {
                        // Update with accumulated text
                        setConversations(prev => {
                            const conv = prev.get(conversationId);
                            if (!conv) return prev;

                            const updatedMessages = conv.messages.map(msg => {
                                if (msg.id === tempMessageId) {
                                    return {
                                        ...msg,
                                        accumulatedText: event.accumulated_text || '',
                                        isStreaming: true,
                                    };
                                }
                                return msg;
                            });

                            return new Map(prev).set(conversationId, {
                                ...conv,
                                messages: updatedMessages,
                            });
                        });
                    } else if (event.type === 'complete' && event.message) {
                        // Replace with final message from backend
                        const backendMessage: Message = {
                            id: String(event.message.id),
                            sender: event.message.sender,
                            senderType: event.message.sender_type,
                            message: event.message.message,
                            timestamp: new Date(event.message.created_at),
                            hasAudio: event.message.has_audio,
                            isStreaming: false,
                            accumulatedText: event.message.message,
                            sender_gender: event.message.sender_gender,
                        };

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

                        console.log('[Context] Stream completed');
                    }
                },
                (error: Error) => {
                    console.error('[Context] Stream error:', error);
                    // Mark message as failed or keep with temp ID
                    setConversations(prev => {
                        const conv = prev.get(conversationId);
                        if (!conv) return prev;

                        const updatedMessages = conv.messages.map(msg => {
                            if (msg.id === tempMessageId) {
                                return {
                                    ...msg,
                                    isStreaming: false,
                                };
                            }
                            return msg;
                        });

                        return new Map(prev).set(conversationId, {
                            ...conv,
                            messages: updatedMessages,
                        });
                    });
                },
                senderGender
            );

            return finalMessage ? String(finalMessage.id) : tempMessageId;
        } catch (error) {
            console.error('Failed to add message with stream:', error);
            return tempMessageId;
        }
    };

    const getMessages = (conversationId: string): Message[] => {
        const conversation = conversations.get(conversationId);
        return conversation?.messages || [];
    };

    const addReceivedMessage = (conversationId: string, apiMessage: any): void => {
        const conversation = conversations.get(conversationId);
        if (!conversation) return;

        // Check if message already exists (to prevent duplicates)
        const messageExists = conversation.messages.some(msg => String(msg.id) === String(apiMessage.id));
        if (messageExists) {
            console.log('[Context] Message already exists:', apiMessage.id);
            return;
        }

        // Convert API message to local format, including sender gender for TTS
        const newMessage: Message = {
            id: String(apiMessage.id),
            sender: apiMessage.sender,
            senderType: apiMessage.sender_type,
            message: apiMessage.message,
            timestamp: new Date(apiMessage.created_at),
            hasAudio: apiMessage.has_audio,
            isStreaming: false,
            sender_gender: apiMessage.sender_gender,
        };

        // Add message to conversation
        setConversations(prev => {
            const conv = prev.get(conversationId);
            if (!conv) return prev;

            return new Map(prev).set(conversationId, {
                ...conv,
                messages: [...conv.messages, newMessage],
            });
        });

        console.log('[Context] Received message from:', apiMessage.sender, 'Gender:', apiMessage.sender_gender);
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
                loadConversation,
                setCurrentConversation,
                getCurrentConversation,
                addMessage,
                addMessageWithStream,
                addReceivedMessage,
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