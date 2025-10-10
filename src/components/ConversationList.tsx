import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useConversation, Conversation } from '../context/ConversationContext';
import Icon from 'react-native-vector-icons/FontAwesome';

type ConversationListProps = {
    onSelectConversation: (conversationId: string) => void;
    selectedConversationId: string | null;
};

export function ConversationList({ onSelectConversation, selectedConversationId }: ConversationListProps) {
    const { conversations } = useConversation();
    const conversationList = Array.from(conversations.values());

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const getLastMessage = (conversation: Conversation) => {
        if (conversation.messages.length === 0) return 'No messages yet';
        const lastMsg = conversation.messages[conversation.messages.length - 1];
        return lastMsg.message.length > 40
            ? lastMsg.message.substring(0, 40) + '...'
            : lastMsg.message;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Conversations</Text>
                <TouchableOpacity style={styles.newConversationButton}>
                    <Icon name="plus" size={16} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                {conversationList.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="comments-o" size={48} color="#ccc" />
                        <Text style={styles.emptyStateText}>No conversations yet</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Start a new conversation to get started
                        </Text>
                    </View>
                ) : (
                    conversationList.map((conversation) => {
                        const isSelected = conversation.id === selectedConversationId;
                        return (
                            <TouchableOpacity
                                key={conversation.id}
                                style={[
                                    styles.conversationItem,
                                    isSelected && styles.conversationItemSelected
                                ]}
                                onPress={() => onSelectConversation(conversation.id)}
                                activeOpacity={0.7}>
                                <View style={styles.avatarPlaceholder}>
                                    <Icon name="user" size={20} color="#fff" />
                                </View>
                                <View style={styles.conversationContent}>
                                    <View style={styles.conversationHeader}>
                                        <Text style={styles.conversationUsername} numberOfLines={1}>
                                            {conversation.username}
                                        </Text>
                                        <Text style={styles.conversationTime}>
                                            {formatDate(conversation.createdAt)}
                                        </Text>
                                    </View>
                                    <Text style={styles.conversationConfig}>
                                        Config: {conversation.configuration}
                                    </Text>
                                    <Text style={styles.conversationPreview} numberOfLines={2}>
                                        {getLastMessage(conversation)}
                                    </Text>
                                    {conversation.messages.length > 0 && (
                                        <View style={styles.messageCount}>
                                            <Text style={styles.messageCountText}>
                                                {conversation.messages.length}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderRightWidth: 1,
        borderRightColor: '#e0e0e0',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    newConversationButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#5a6470',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    conversationItem: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        gap: 12,
    },
    conversationItemSelected: {
        backgroundColor: '#e8f4f8',
        borderLeftWidth: 3,
        borderLeftColor: '#4a90e2',
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#5a6470',
        justifyContent: 'center',
        alignItems: 'center',
    },
    conversationContent: {
        flex: 1,
        justifyContent: 'center',
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    conversationUsername: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        flex: 1,
    },
    conversationTime: {
        fontSize: 12,
        color: '#999',
        marginLeft: 8,
    },
    conversationConfig: {
        fontSize: 12,
        color: '#4a90e2',
        marginBottom: 4,
    },
    conversationPreview: {
        fontSize: 14,
        color: '#666',
        lineHeight: 18,
    },
    messageCount: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#4a90e2',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    messageCountText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
    },
});
