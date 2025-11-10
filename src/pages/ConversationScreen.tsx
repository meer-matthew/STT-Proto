import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    ScrollView,
    Alert,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
    Pressable,
    Image,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { MessageBubble } from '../components/MessageBubble';
import { KeyboardInput } from '../components/KeyboardInput';
import { SoundMeter } from '../components/SoundMeter';
import { useConversation } from '../context/ConversationContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useTokenExpiration } from '../hooks/useTokenExpiration';
import { SpeechIndicator } from '../components/SpeechIndicator';
import { AddParticipantModal } from '../components/AddParticipantModal';
import { ConversationDrawer } from '../components/ConversationDrawer';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';
import { AppLayout } from '../components/AppLayout';
import { conversationService } from '../services/conversationService';
import { authService } from '../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversation'>;

export function ConversationScreen({ navigation, route }: Props) {
    const theme = useTheme();
    const styles = createStyles(theme);
    const { username, conversationId: paramConversationId } = route.params;
    // const { configuration } = route.params; // Commented out - configuration no longer used
    const scrollViewRef = useRef<ScrollView>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [conversationOwner, setConversationOwner] = useState<any>(null);
    const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
    const [showConversationDrawer, setShowConversationDrawer] = useState(false);
    const [userGender, setUserGender] = useState<'male' | 'female' | 'other' | undefined>(undefined);

    // Token expiration handler
    const { handleAuthError } = useTokenExpiration();

    // Fetch current user's gender for voice selection
    useEffect(() => {
        const fetchUserGender = async () => {
            try {
                const user = await authService.getUser();
                if (user && user.gender) {
                    setUserGender(user.gender);
                }
            } catch (error) {
                console.error('Failed to fetch user gender:', error);
            }
        };

        fetchUserGender();
    }, []);

    const { createConversation, addMessage, addReceivedMessage, getMessages, setCurrentConversation, getCurrentConversation, loadConversation } = useConversation();
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const messages = conversationId ? getMessages(conversationId) : [];

    // Ref to store stream cleanup function
    const streamCleanupRef = useRef<(() => void) | null>(null);

    // Auto-create or load conversation on mount
    useEffect(() => {
        if (paramConversationId) {
            // Load existing conversation
            handleLoadConversation(paramConversationId);
        } else {
            // Create new conversation
            handleCreateConversation();
        }
    }, [paramConversationId]);

    // Fetch participants when conversation changes
    useEffect(() => {
        const fetchParticipants = async () => {
            if (!conversationId) {
                setParticipants([]);
                setConversationOwner(null);
                return;
            }

            try {
                // Fetch participants
                const participantsList = await conversationService.getParticipants(Number(conversationId));
                setParticipants(participantsList);

                // Fetch conversation details to get owner info
                const currentConv = getCurrentConversation();
                if (currentConv) {
                    setConversationOwner({
                        username: currentConv.username,
                        user_type: 'user' // Default, ideally should be fetched from backend
                    });
                }
            } catch (error: any) {
                // Check if token has expired
                if (handleAuthError(error)) {
                    return; // Token expired, handleAuthError will redirect
                }
                console.error('Failed to fetch participants:', error);
                setParticipants([]);
            }
        };

        fetchParticipants();
    }, [conversationId, handleAuthError]);

    // Enable message polling for real-time reception from other users
    useEffect(() => {
        if (!conversationId) {
            // Clean up any existing stream
            if (streamCleanupRef.current) {
                streamCleanupRef.current();
                streamCleanupRef.current = null;
            }
            return;
        }

        // Start polling for new messages from other users
        const startMessagePolling = async () => {
            console.log('[ConversationScreen] Starting message polling for conversation:', conversationId);

            try {
                const cleanup = await conversationService.streamMessages(
                    Number(conversationId),
                    (message) => {
                        // Check if this is a message from another user (not sent by current user locally)
                        if (message.sender !== username) {
                            console.log('[ConversationScreen] Received message from:', message.sender);
                            addReceivedMessage(conversationId, message);
                        } else {
                            // Only log our own messages from polling if they weren't already added locally
                            console.log('[ConversationScreen] Skipping own message from polling');
                        }
                    },
                    (error) => {
                        console.error('[ConversationScreen] Message polling error:', error);
                    }
                );
                streamCleanupRef.current = cleanup;
            } catch (error) {
                console.error('[ConversationScreen] Failed to start message polling:', error);
            }
        };

        startMessagePolling();

        return () => {
            // Cleanup on unmount or conversation change
            if (streamCleanupRef.current) {
                streamCleanupRef.current();
                streamCleanupRef.current = null;
            }
        };
    }, [conversationId, username, addReceivedMessage]);

    const handleCreateConversation = async () => {
        try {
            const id = await createConversation(username, '1:1'); // Default configuration
            setConversationId(id);
            setCurrentConversation(id);
        } catch (error: any) {
            // Check if token has expired
            if (handleAuthError(error)) {
                return; // Token expired, handleAuthError will redirect
            }
            Alert.alert('Error', 'Failed to create conversation. Please try again.');
            console.error('Create conversation error:', error);
        }
    };

    const handleLoadConversation = async (convId: number) => {
        try {
            const id = String(convId);
            // Load conversation from backend
            await loadConversation(id);
            setConversationId(id);
            setCurrentConversation(id);
        } catch (error: any) {
            // Check if token has expired
            if (handleAuthError(error)) {
                return; // Token expired, handleAuthError will redirect
            }
            Alert.alert('Error', 'Failed to load conversation. Please try again.');
            console.error('Load conversation error:', error);
        }
    };

    const handleRefreshParticipants = async () => {
        if (!conversationId) return;

        try {
            const participantsList = await conversationService.getParticipants(Number(conversationId));
            setParticipants(participantsList);
        } catch (error: any) {
            // Check if token has expired
            if (handleAuthError(error)) {
                return; // Token expired, handleAuthError will redirect
            }
            console.error('Failed to refresh participants:', error);
        }
    };

    const handleAddParticipantClick = () => {
        setShowAddParticipantModal(true);
    };

    const handleSelectConversationFromDrawer = async (convId: string) => {
        await handleLoadConversation(Number(convId));
    };

    const handleCreateConversationFromDrawer = async () => {
        await handleCreateConversation();
    };

    const {
        isRecording,
        transcript,
        error,
        isAvailable,
        audioLevel,
        startRecording,
        stopRecording,
        cancelRecording,
    } = useSpeechToText();

    const { speak, stop, isSpeaking, currentlySpeakingId } = useTextToSpeech();

    console.log(transcript)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages, transcript, isTranscribing]);

    // Handle errors
    useEffect(() => {
        if (error) {
            Alert.alert('Speech Recognition Error', error);
        }
    }, [error]);

    // Don't show availability alert on mount - only show errors when actually trying to use it

    const handleMicPress = async () => {
        if (isRecording) {
            // Show transcribing state
            setIsTranscribing(true);

            // Stop recording and get the transcribed text directly
            const transcribedText = await stopRecording();

            // Automatically add the message when recording stops
            if (transcribedText.trim() && conversationId) {
                const messageText = transcribedText.trim();
                const messageId = addMessage(conversationId, username, 'user', messageText, true);

                // Automatically play TTS for the sent message
                if (messageId) {
                    // Small delay to ensure message is rendered
                    setTimeout(() => {
                        speak(messageText, messageId, userGender);
                    }, 100);
                }
            }

            // Hide transcribing state
            setIsTranscribing(false);
        } else {
            await startRecording();
        }
    };

    const handleMessageSent = (messageText: string, messageId: string) => {
        // Automatically play TTS when a text message is sent
        setTimeout(() => {
            speak(messageText, messageId, userGender);
        }, 100);
    };

    const handleCancelRecording = async () => {
        await cancelRecording();
    };

    const handlePlayAudio = (messageId: string, messageText: string) => {
        if (currentlySpeakingId === messageId && isSpeaking) {
            stop();
        } else {
            speak(messageText, messageId, userGender);
        }
    };

    const formatTime = (date: Date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, '0');
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    };

    // Parse configuration to get caregiver count - COMMENTED OUT
    // const caregiverCount = parseInt(configuration.split(':')[0]) || 1;

    return (
        <AppLayout
            showHeader={true}
            showHeaderBorder={true}
            navigation={navigation}
            showMenuButton={true}
            onMenuPress={() => setShowConversationDrawer(true)}>
            <SafeAreaView style={styles.flex}>
                <KeyboardAvoidingView
                    style={styles.conversationPanel}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
                    {/* Top Navigation Bar */}
                    <View style={styles.topNavBar}>
                        {/* Participants List - Left Side */}
                        {conversationId && (conversationOwner || participants.length > 0) && (
                            <>
                                {/* Caretakers and Users */}
                                {(() => {
                                    const allParticipants = [
                                        ...(conversationOwner ? [conversationOwner] : []),
                                        ...participants
                                    ];
                                    const caretakers = allParticipants.filter(p => p.user_type === 'caretaker');
                                    const users = allParticipants.filter(p => p.user_type !== 'caretaker');

                                    const getInitials = (username: string) => {
                                        return username
                                            .split(' ')
                                            .map(word => word[0])
                                            .join('')
                                            .toUpperCase()
                                            .slice(0, 2);
                                    };

                                    return (
                                        <View style={styles.participantsContainer}>
                                            {/* Caretakers Column */}
                                            {caretakers.length > 0 && (
                                                <View style={styles.roleColumn}>
                                                    <View style={styles.roleTitleContainer}>
                                                        <Icon name="user-md" size={12} color={theme.colors.primary} />
                                                        <Text style={styles.roleTitle}>Caretakers</Text>
                                                    </View>
                                                    <View style={styles.avatarsRow}>
                                                        {caretakers.map((participant, index) => (
                                                            <Pressable
                                                                key={`caretaker-${index}`}
                                                                onPress={() => {
                                                                    Alert.alert(
                                                                        'Caretaker',
                                                                        `${participant.username} is caring for this conversation`
                                                                    );
                                                                }}>
                                                                <View style={[styles.avatarMedium, styles.avatarCaretaker]}>
                                                                    {participant.user?.img_url ? (
                                                                        <Image
                                                                            source={{ uri: participant.user.img_url }}
                                                                            style={styles.avatarImage}
                                                                        />
                                                                    ) : (
                                                                        <Icon name="user-md" size={12} color={theme.colors.white} />
                                                                    )}
                                                                </View>
                                                            </Pressable>
                                                        ))}
                                                    </View>
                                                </View>
                                            )}

                                            {/* Users Column */}
                                            {users.length > 0 && (
                                                <View style={styles.roleColumn}>
                                                    <View style={styles.roleTitleContainer}>
                                                        <Icon name="user" size={12} color={theme.colors.secondary} />
                                                        <Text style={styles.roleTitle}>Users</Text>
                                                    </View>
                                                    <View style={styles.avatarsRow}>
                                                        {users.map((participant, index) => (
                                                            <Pressable
                                                                key={`user-${index}`}
                                                                onPress={() => {
                                                                    Alert.alert(
                                                                        'Participant',
                                                                        `${participant.username} is participating in this conversation`
                                                                    );
                                                                }}>
                                                                <View style={[styles.avatarMedium, styles.avatarUser]}>
                                                                    {participant.user?.img_url ? (
                                                                        <Image
                                                                            source={{ uri: participant.user.img_url }}
                                                                            style={styles.avatarImage}
                                                                        />
                                                                    ) : (
                                                                        <Icon name="user" size={12} color={theme.colors.white} />
                                                                    )}
                                                                </View>
                                                            </Pressable>
                                                        ))}
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })()}

                                {/* Add Participant Button - Right Side */}
                                <TouchableOpacity
                                    style={styles.addParticipantButton}
                                    onPress={handleAddParticipantClick}
                                    activeOpacity={0.7}>
                                    <Icon name="plus" size={16} color={theme.colors.white} />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {/* COMMENTED OUT - Configuration Header */}
                    {/* <View style={styles.conversationHeader}>
                        <ConfigurationHeader configuration={configuration} caregiverCount={caregiverCount} />
                    </View> */}

                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled">
                        <View style={styles.messagesContainer}>
                            {!conversationId ? (
                                <View style={styles.emptyStateContainer}>
                                    <View style={styles.emptyStateIcon}>
                                        <Icon name="comment-o" size={64} color="#d0d0d0" />
                                    </View>
                                    <Text style={styles.emptyStateTitle}>
                                        Starting conversation...
                                    </Text>
                                    <Text style={styles.emptyStateDescription}>
                                        Please wait while we set up your conversation
                                    </Text>
                                </View>
                            ) : messages.length === 0 && !isRecording ? (
                                <View style={styles.emptyStateContainer}>
                                    <View style={styles.emptyStateIcon}>
                                        <Icon name="comments-o" size={64} color="#d0d0d0" />
                                    </View>
                                    <Text style={styles.emptyStateTitle}>
                                        No messages yet
                                    </Text>
                                    <Text style={styles.emptyStateDescription}>
                                        Start the conversation by tapping the microphone or typing a message below
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    {messages.map((message) => (
                                        <MessageBubble
                                            key={message.id}
                                            name={message.sender}
                                            time={formatTime(message.timestamp)}
                                            message={message.accumulatedText || message.message}
                                            isCurrentUser={message.sender === username}
                                            hasAudio={message.hasAudio}
                                            onPlayAudio={() => handlePlayAudio(message.id, message.message)}
                                            isSpeaking={currentlySpeakingId === message.id && isSpeaking}
                                            isStreaming={message.isStreaming}
                                        />
                                    ))}
                                </>
                            )}

                            {isRecording && (
                                <SpeechIndicator
                                    text={transcript || "Listening..."}
                                    onCancel={handleCancelRecording}
                                />
                            )}

                            {(isRecording || isTranscribing) && transcript && (
                                <View style={styles.loadingMessageContainer}>
                                    <View style={styles.loadingAvatarContainer}>
                                        <View style={styles.loadingAvatar} />
                                    </View>
                                    <View style={styles.loadingBubbleWrapper}>
                                        <View style={styles.loadingBubble}>
                                            <Text style={styles.loadingMessageText}>
                                                {transcript}
                                            </Text>
                                            {isTranscribing && (
                                                <Text style={styles.processingIndicator}>processing...</Text>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            )}

                            {(isRecording || isTranscribing) && !transcript && (
                                <View style={styles.loadingMessageContainer}>
                                    <View style={styles.loadingAvatarContainer}>
                                        <View style={styles.loadingAvatar} />
                                    </View>
                                    <View style={styles.loadingBubbleWrapper}>
                                        <View style={styles.loadingBubble}>
                                            <ActivityIndicator size="small" color={theme.colors.white} />
                                            <Text style={styles.loadingMessageText}>
                                                {isRecording ? 'Listening...' : 'Transcribing...'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {conversationId && (
                        <>
                            <SoundMeter level={audioLevel} isRecording={isRecording} />

                            <KeyboardInput
                                username={username}
                                conversationId={conversationId}
                                onMicPress={handleMicPress}
                                isRecording={isRecording}
                                onMessageSent={handleMessageSent}
                            />
                        </>
                    )}
                </KeyboardAvoidingView>

                {/* Add Participant Modal */}
                {conversationId && (
                    <AddParticipantModal
                        visible={showAddParticipantModal}
                        onClose={() => setShowAddParticipantModal(false)}
                        conversationId={conversationId}
                        currentParticipants={participants}
                        onParticipantAdded={handleRefreshParticipants}
                    />
                )}

                {/* Conversation Drawer */}
                <ConversationDrawer
                    visible={showConversationDrawer}
                    onClose={() => setShowConversationDrawer(false)}
                    onSelectConversation={handleSelectConversationFromDrawer}
                    selectedConversationId={conversationId}
                    onCreateConversation={handleCreateConversationFromDrawer}
                />
            </SafeAreaView>
        </AppLayout>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    conversationPanel: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingBottom: theme.spacing.xl,
    },
    topNavBar: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    participantsContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: theme.spacing.md,
        alignItems: 'flex-start',
    },
    roleColumn: {
        flex: 1,
        gap: theme.spacing.xs,
    },
    roleTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    roleTitle: {
        fontSize: theme.fontSize.xs,
        fontWeight: '700',
        color: theme.colors.textSecondary,
    },
    avatarsRow: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    avatarMedium: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    avatarSmall: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarCaretaker: {
        backgroundColor: theme.colors.primary,
    },
    avatarUser: {
        backgroundColor: theme.colors.secondary,
    },
    activeBadge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        marginLeft: 2,
    },
    participantNameText: {
        fontSize: theme.fontSize.xs,
        fontWeight: '600',
        color: theme.colors.text,
    },
    avatarInitials: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.white,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: theme.spacing.xl,
    },
    messagesContainer: {
        paddingTop: theme.spacing.xl,
        flex: 1,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyStateIcon: {
        marginBottom: theme.spacing.xl,
        opacity: 0.6,
    },
    emptyStateTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    emptyStateDescription: {
        fontSize: 16,
        fontWeight: '400',
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 320,
    },
    addParticipantButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    loadingMessageContainer: {
        flexDirection: 'row-reverse',
        marginBottom: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    loadingAvatarContainer: {
        paddingTop: 8,
    },
    loadingAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primaryLight,
    },
    loadingBubbleWrapper: {
        flex: 1,
        alignItems: 'flex-end',
    },
    loadingBubble: {
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 4,
        padding: 16,
        maxWidth: '75%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    loadingMessageText: {
        fontSize: 16,
        fontWeight: '400',
        color: theme.colors.white,
        lineHeight: 22,
    },
    processingIndicator: {
        fontSize: 12,
        fontWeight: '300',
        color: theme.colors.white,
        opacity: 0.7,
        marginTop: theme.spacing.xs,
    },
});