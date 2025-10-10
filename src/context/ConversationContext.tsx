import React, { createContext, useContext, useState, ReactNode } from 'react';

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
    createConversation: (username: string, configuration: string) => string;
    setCurrentConversation: (id: string) => void;
    getCurrentConversation: () => Conversation | null;
    addMessage: (conversationId: string, sender: string, senderType: 'user' | 'caregiver', message: string, hasAudio?: boolean) => void;
    getMessages: (conversationId: string) => Message[];
    clearConversation: (conversationId: string) => void;
};

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
    const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

    const createConversation = (username: string, configuration: string): string => {
        const id = `conv_${Date.now()}`;
        const newConversation: Conversation = {
            id,
            username,
            configuration,
            createdAt: new Date(),
            messages: [],
        };

        setConversations(prev => new Map(prev).set(id, newConversation));
        setCurrentConversationId(id);
        return id;
    };

    const setCurrentConversation = (id: string) => {
        if (conversations.has(id)) {
            setCurrentConversationId(id);
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
    ) => {
        const conversation = conversations.get(conversationId);
        if (!conversation) return;

        const newMessage: Message = {
            id: `msg_${Date.now()}`,
            sender,
            senderType,
            message,
            timestamp: new Date(),
            hasAudio,
        };

        const updatedConversation = {
            ...conversation,
            messages: [...conversation.messages, newMessage],
        };

        setConversations(prev => new Map(prev).set(conversationId, updatedConversation));
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
                createConversation,
                setCurrentConversation,
                getCurrentConversation,
                addMessage,
                getMessages,
                clearConversation,
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