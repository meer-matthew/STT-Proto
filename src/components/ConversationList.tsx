import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useConversation, Conversation } from '../context/ConversationContext';
import { SelectParticipantsModal } from './SelectParticipantsModal';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';
import { User } from '../services/authService';
import { conversationService } from '../services/conversationService';
import { getAvatarForUser } from '../utils/avatarUtils';

type ConversationListProps = {
    onSelectConversation: (conversationId: string) => void;
    selectedConversationId: string | null;
    onCreateConversation: (selectedUsers?: any[]) => void;
};

export function ConversationList({ onSelectConversation, selectedConversationId, onCreateConversation }: ConversationListProps) {
    const { conversations, fetchUserConversations, isLoading } = useConversation();
    const theme = useTheme();
    const conversationList = Array.from(conversations.values());
    const styles = createStyles(theme);

    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [showSelectParticipants, setShowSelectParticipants] = useState(false);

    // Fetch conversations on mount
    useEffect(() => {
        const loadConversations = async () => {
            try {
                setLoadingError(null);
                await fetchUserConversations();
            } catch (error: any) {
                console.error('Failed to load conversations:', error);
                setLoadingError(error.message || 'Failed to load conversations');
            }
        };

        loadConversations();
    }, []);

    const handleCreateConversationClick = () => {
        setShowSelectParticipants(true);
    };

    const handleConfirmParticipants = async (selectedUsers: User[]) => {
        setShowSelectParticipants(false);
        onCreateConversation(selectedUsers);
    };

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
            {/* Header with action button */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Conversations</Text>
                <TouchableOpacity
                    style={styles.newConversationButton}
                    onPress={handleCreateConversationClick}
                    activeOpacity={0.7}>
                    <Icon name="plus" size={16} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Select Participants Modal */}
            <SelectParticipantsModal
                visible={showSelectParticipants}
                onClose={() => setShowSelectParticipants(false)}
                onConfirm={handleConfirmParticipants}
            />

            {/* Conversations List */}
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            {isLoading ? (
                <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.emptyStateText, { marginTop: theme.spacing.lg }]}>
                        Loading conversations...
                    </Text>
                </View>
            ) : loadingError ? (
                <View style={styles.emptyState}>
                    <Icon name="exclamation-triangle" size={48} color={theme.colors.error} />
                    <Text style={[styles.emptyStateText, { color: theme.colors.error }]}>
                        Failed to load conversations
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                        {loadingError}
                    </Text>
                </View>
            ) : conversationList.length === 0 ? (
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
                            <Image
                                source={getAvatarForUser(conversation.username)}
                                style={styles.avatarPlaceholder}
                            />
                            <View style={styles.conversationContent}>
                                <View style={styles.conversationHeader}>
                                    <Text style={styles.conversationUsername}>
                                        {conversation.username}
                                    </Text>
                                    <Text style={styles.conversationTime}>
                                        {formatDate(conversation.createdAt)}
                                    </Text>
                                </View>
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

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderRightWidth: theme.borderWidth.thin,
        borderRightColor: theme.colors.borderLight,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderBottomWidth: theme.borderWidth.thin,
        borderBottomColor: theme.colors.borderLight,
    },
    headerTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: '700',
        fontFamily: theme.fonts.bold,
        color: '#1a1a1a',
    },
    newConversationButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.secondary,
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
        paddingHorizontal: theme.spacing.lg,
    },
    emptyStateText: {
        fontSize: theme.fontSize.lg,
        fontWeight: '600',
        fontFamily: theme.fonts.bold,
        color: '#666',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xs,
    },
    emptyStateSubtext: {
        fontSize: theme.fontSize.sm,
        fontFamily: theme.fonts.regular,
        color: '#999',
        textAlign: 'center',
    },
    conversationItem: {
        flexDirection: 'row',
        padding: theme.spacing.sm,
        backgroundColor: theme.colors.white,
        borderBottomWidth: theme.borderWidth.thin,
        borderBottomColor: '#f0f0f0',
        gap: theme.spacing.sm,
    },
    conversationItemSelected: {
        backgroundColor: '#e8f4f8',
        borderLeftWidth: theme.borderWidth.thick,
        borderLeftColor: theme.colors.primary,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    conversationContent: {
        flex: 1,
        justifyContent: 'center',
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    conversationUsername: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
        fontFamily: theme.fonts.bold,
        color: '#1a1a1a',
        flex: 1,
    },
    participantsList: {
        flex: 1,
        gap: 4,
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
    },
    participantName: {
        fontSize: theme.fontSize.xs,
        fontWeight: '600',
        fontFamily: theme.fonts.bold,
        color: '#1a1a1a',
    },
    avatarCaretaker: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarUser: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: theme.colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    conversationTime: {
        fontSize: theme.fontSize.xs,
        fontFamily: theme.fonts.regular,
        color: '#999',
        marginLeft: theme.spacing.xs,
    },
    conversationPreview: {
        fontSize: theme.fontSize.sm,
        fontFamily: theme.fonts.regular,
        color: '#666',
        lineHeight: 18,
    },
    messageCount: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: theme.colors.primary,
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
        fontFamily: theme.fonts.bold,
        color: theme.colors.white,
    },
});