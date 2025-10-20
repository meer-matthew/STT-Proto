import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useConversation, Conversation } from '../context/ConversationContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';
import { conversationService } from '../services/conversationService';

type ConversationListProps = {
    onSelectConversation: (conversationId: string) => void;
    selectedConversationId: string | null;
    onCreateConversation: () => void;
};

export function ConversationList({ onSelectConversation, selectedConversationId, onCreateConversation }: ConversationListProps) {
    const { conversations } = useConversation();
    const theme = useTheme();
    const conversationList = Array.from(conversations.values());
    const styles = createStyles(theme);

    const [conversationParticipants, setConversationParticipants] = useState<Map<string, any[]>>(new Map());

    // Fetch participants for all conversations
    useEffect(() => {
        const fetchParticipants = async () => {
            const participantsMap = new Map<string, any[]>();

            for (const conversation of conversationList) {
                try {
                    const participants = await conversationService.getParticipants(Number(conversation.id));
                    participantsMap.set(conversation.id, participants);
                } catch (error) {
                    console.error(`Failed to fetch participants for conversation ${conversation.id}:`, error);
                    participantsMap.set(conversation.id, []);
                }
            }

            setConversationParticipants(participantsMap);
        };

        if (conversationList.length > 0) {
            fetchParticipants();
        }
    }, [conversationList.length]);

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
                    onPress={onCreateConversation}
                    activeOpacity={0.7}>
                    <Icon name="plus" size={16} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Conversations List */}
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
                    const participants = conversationParticipants.get(conversation.id) || [];

                    // Get owner info from conversation
                    const ownerInfo = {
                        username: conversation.username,
                        user_type: 'user' // Default, we'll need to fetch this properly
                    };

                    // Combine owner and participants
                    const allParticipants = [ownerInfo, ...participants];

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
                                <Icon name="users" size={20} color="#fff" />
                            </View>
                            <View style={styles.conversationContent}>
                                <View style={styles.conversationHeader}>
                                    <View style={styles.participantsList}>
                                        {allParticipants.map((participant, index) => (
                                            <View key={index} style={styles.participantRow}>
                                                <Text style={styles.participantName}>
                                                    {participant.username}
                                                </Text>
                                                <View style={styles.rolePill}>
                                                    <Text style={styles.rolePillText}>
                                                        {participant.user_type === 'caretaker' ? 'Caretaker' : 'User'}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
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
        color: '#666',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xs,
    },
    emptyStateSubtext: {
        fontSize: theme.fontSize.sm,
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
        backgroundColor: theme.colors.secondary,
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
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    conversationUsername: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
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
        gap: 6,
        flexWrap: 'wrap',
    },
    participantName: {
        fontSize: theme.fontSize.sm,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    rolePill: {
        backgroundColor: '#e8f4f8',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    rolePillText: {
        fontSize: 9,
        fontWeight: '600',
        color: theme.colors.primary,
        textTransform: 'uppercase',
    },
    conversationTime: {
        fontSize: theme.fontSize.xs,
        color: '#999',
        marginLeft: theme.spacing.xs,
    },
    conversationPreview: {
        fontSize: theme.fontSize.sm,
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
        color: theme.colors.white,
    },
});