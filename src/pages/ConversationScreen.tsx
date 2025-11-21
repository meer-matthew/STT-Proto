import React, { useRef, useEffect, useState, useCallback } from 'react';
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
import { SelectParticipantsModal } from '../components/SelectParticipantsModal';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';
import { AppLayout } from '../components/AppLayout';
import { conversationService } from '../services/conversationService';
import { authService } from '../services/authService';
import { getAvatarForUser } from '../utils/avatarUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversation'>;

export function ConversationScreen({ navigation, route }: Props) {
    const theme = useTheme();
    const styles = createStyles(theme);
    const { username, conversationId: paramConversationId } = route.params;
    const scrollViewRef = useRef<ScrollView>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [conversationOwner, setConversationOwner] = useState<any>(null);
    const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
    const [showConversationDrawer, setShowConversationDrawer] = useState(false);
    const [showSelectParticipantsForCreate, setShowSelectParticipantsForCreate] = useState(false);
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

    const { createConversation, addMessage, addMessageWithStream, addReceivedMessage, getMessages, setCurrentConversation, getCurrentConversation, loadConversation } = useConversation();
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const messages = conversationId ? getMessages(conversationId) : [];

    // Ref to store stream cleanup function
    const streamCleanupRef = useRef<(() => void) | null>(null);

    // Load conversation if passed as parameter, otherwise show empty state
    useEffect(() => {
        if (paramConversationId) {
            // Load existing conversation if one was passed as parameter
            handleLoadConversation(paramConversationId);
        }
        // If no paramConversationId, show empty state - user can select from drawer or create with +
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
                            console.log('[ConversationScreen] Message text:', message.message);
                            console.log('[ConversationScreen] Sender gender:', message.sender_gender);

                            const messageId = addReceivedMessage(conversationId, message);
                            console.log('[ConversationScreen] Added message with ID:', messageId);

                            // Auto-play TTS for incoming messages from other users
                            if (messageId && message.message) {
                                console.log('[ConversationScreen] ✓ Conditions met for TTS - calling speak()');
                                console.log('[ConversationScreen] TTS params:', {
                                    text: message.message.substring(0, 50),
                                    messageId,
                                    gender: message.sender_gender
                                });

                                // Use setTimeout to ensure message is rendered first
                                setTimeout(() => {
                                    console.log('[ConversationScreen] Executing TTS for message:', messageId);
                                    try {
                                        speak(message.message, messageId, message.sender_gender);
                                        console.log('[ConversationScreen] ✓ speak() called successfully');
                                    } catch (err) {
                                        console.error('[ConversationScreen] ✗ Error calling speak():', err);
                                    }
                                }, 100);
                            } else {
                                console.log('[ConversationScreen] ✗ TTS conditions not met', {
                                    messageId: !!messageId,
                                    messageText: !!message.message
                                });
                            }
                        } else {
                            // Only log our own messages from polling if they weren't already added locally
                            console.log('[ConversationScreen] Skipping own message from polling');
                        }
                    },
                    (error) => {
                        console.error('[ConversationScreen] Message polling error:', error);
                        console.error('[ConversationScreen] Error details:', {
                            message: error?.message,
                            code: error?.code,
                            status: error?.status,
                            type: error?.constructor?.name,
                            fullError: JSON.stringify(error)
                        });
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
    }, [conversationId, username, addReceivedMessage, speak]);

    const handleCreateConversation = async (selectedUsers?: any[]) => {
        try {
            // Extract participant IDs from selected users
            const participantIds = selectedUsers ? selectedUsers.map(user => user.id) : undefined;

            // Create conversation with optional participants via API
            const response = await conversationService.createConversation('1:1', participantIds);
            const id = response.id;

            setConversationId(id);
            setCurrentConversation(id);

            if (selectedUsers && selectedUsers.length > 0) {
                console.log(`[ConversationScreen] Created conversation with ${selectedUsers.length} participants`);
            }
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

    const handleCreateConversationFromDrawer = async (selectedUsers?: any[]) => {
        await handleCreateConversation(selectedUsers);
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
        setAutoStopCallback,
    } = useSpeechToText();

    const { speak, stop, isSpeaking, currentlySpeakingId } = useTextToSpeech();

    console.log(transcript)

    // Note: Loading state is now cleared immediately after sending message,
    // not waiting for TTS to finish. This improves UX responsiveness.

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages, transcript, isTranscribing]);

    // Scroll to bottom when conversation is first loaded (to show latest message)
    useEffect(() => {
        if (conversationId && messages.length > 0) {
            // Use a small timeout to ensure the scroll view has been rendered
            const timeoutId = setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [conversationId]);

    // Handle errors
    useEffect(() => {
        if (error) {
            Alert.alert('Speech Recognition Error', error);
        }
    }, [error]);

    // Don't show availability alert on mount - only show errors when actually trying to use it

    const handleMicPress = useCallback(async () => {
        if (isRecording) {
            // Show transcribing state
            setIsTranscribing(true);
            setIsSendingMessage(true);

            // Stop recording and get the transcribed text directly
            const transcribedText = await stopRecording();

            // Automatically send the message when recording stops (with gender for TTS voice selection)
            if (transcribedText.trim() && conversationId) {
                const messageText = transcribedText.trim();

                try {
                    // Send message to backend using stream (same as keyboard input)
                    const messageId = await addMessageWithStream(conversationId, username, 'user', messageText, true, userGender);

                    // Hide transcribing state immediately - don't wait for TTS
                    setIsTranscribing(false);
                    setIsSendingMessage(false);

                    // Start TTS in parallel without blocking the UI
                    if (messageId) {
                        // Fire TTS immediately (no delay) - it will start rendering
                        speak(messageText, messageId, userGender).catch(err => {
                            console.error('TTS error:', err);
                        });
                    }
                } catch (error) {
                    // If there's an error sending, clear loading state immediately
                    setIsTranscribing(false);
                    setIsSendingMessage(false);
                    console.error('Error sending transcribed message:', error);
                }
            } else {
                // No text to send
                setIsTranscribing(false);
                setIsSendingMessage(false);

                // Show alert if no transcript was recorded
                if (!transcribedText.trim()) {
                    Alert.alert(
                        'No Audio Detected',
                        "We didn't hear you. Can you try again?",
                        [{ text: 'OK', onPress: () => {} }]
                    );
                }
            }
        } else {
            await startRecording();
        }
    }, [isRecording, stopRecording, startRecording, conversationId, username, addMessageWithStream, speak, userGender]);

    const handleMessageSent = (messageText: string, messageId: string) => {
        // Immediately start TTS without delay - no need to wait for rendering
        speak(messageText, messageId, userGender).catch(err => {
            console.error('TTS error:', err);
        });
    };

    const handleCancelRecording = async () => {
        // Show processing state while canceling
        setIsTranscribing(true);
        setIsSendingMessage(true);

        // Cancel the recording
        await cancelRecording();

        // Clear the processing state
        setIsTranscribing(false);
        setIsSendingMessage(false);
    };

    const handlePlayAudio = (messageId: string, messageText: string, senderGender?: 'male' | 'female' | 'other') => {
        if (currentlySpeakingId === messageId && isSpeaking) {
            stop();
        } else {
            // Use sender's gender from message, fallback to current user gender
            const genderToUse = senderGender || userGender;
            speak(messageText, messageId, genderToUse);
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

    // Set up automatic recording stop after 1 second of silence
    useEffect(() => {
        // Create a callback that will be called when silence is detected
        const autoStopHandler = async () => {
            console.log('[Audio] Auto-stop triggered - silence detected for 1 second');
            if (isRecording) {
                await handleMicPress(); // This will stop recording and send the message
            }
        };

        // Register the callback
        setAutoStopCallback(autoStopHandler);

        // Cleanup: clear callback when component unmounts
        return () => {
            setAutoStopCallback(null);
        };
    }, [isRecording, setAutoStopCallback, handleMicPress]);

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
                    {conversationId && (conversationOwner || participants.length > 0) && (
                        <View style={styles.topNavBar}>
                        {/* Participants List - Left Side */}
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
                                                                        <Image
                                                                            source={getAvatarForUser(participant.username)}
                                                                            style={styles.avatarImage}
                                                                        />
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
                                                                        <Image
                                                                            source={getAvatarForUser(participant.username)}
                                                                            style={styles.avatarImage}
                                                                        />
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
                    </View>)}

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
                                    <View style={styles.emptyStateIconWrapper}>
                                        <View style={styles.emptyStateIconBackground}>
                                            <Icon name="comments-o" size={72} color={theme.colors.primary} />
                                        </View>
                                    </View>
                                    <Text style={styles.emptyStateTitle}>
                                        Let's get started!
                                    </Text>
                                    {/* Two Action Panels */}
                                    <View style={styles.actionPanelsContainer}>
                                        {/* Create Conversation Panel */}
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.actionPanel,
                                                pressed && styles.actionPanelPressed,
                                                { backgroundColor: theme.colors.primary }
                                            ]}
                                            onPress={() => setShowSelectParticipantsForCreate(true)}>
                                            <View style={[styles.actionPanelIcon, { backgroundColor: `${theme.colors.white}30` }]}>
                                                <Icon name="plus-circle" size={32} color={theme.colors.white} />
                                            </View>
                                            <Text style={[styles.actionPanelTitle, { color: theme.colors.white }]}>Create New Chat</Text>
                                            <Text style={[styles.actionPanelSubtitle, { color: `${theme.colors.white}cc` }]}>
                                                Start a conversation with one or more people
                                            </Text>
                                        </Pressable>

                                        {/* Select Conversation Panel */}
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.actionPanel,
                                                pressed && styles.actionPanelPressed,
                                                { backgroundColor: theme.colors.secondary }
                                            ]}
                                            onPress={() => setShowConversationDrawer(true)}>
                                            <View style={[styles.actionPanelIcon, { backgroundColor: `${theme.colors.white}30` }]}>
                                                <Icon name="folder-open" size={32} color={theme.colors.white} />
                                            </View>
                                            <Text style={[styles.actionPanelTitle, { color: theme.colors.white }]}>Browse Chats</Text>
                                            <Text style={[styles.actionPanelSubtitle, { color: `${theme.colors.white}cc` }]}>
                                                Pick up a previous conversation
                                            </Text>
                                        </Pressable>
                                    </View>
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
                                            onPlayAudio={() => handlePlayAudio(message.id, message.message, message.sender_gender)}
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
                                    isListening={true}
                                />
                            )}

                            {isTranscribing && !isRecording && (
                                <SpeechIndicator
                                    text=""
                                    isListening={false}
                                />
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
                                isLoading={isSendingMessage}
                                onSendStart={() => setIsSendingMessage(true)}
                                onSendEnd={() => setIsSendingMessage(false)}
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

                {/* Select Participants Modal for Creating New Conversation */}
                <SelectParticipantsModal
                    visible={showSelectParticipantsForCreate}
                    onClose={() => setShowSelectParticipantsForCreate(false)}
                    onConfirm={(selectedUsers) => {
                        setShowSelectParticipantsForCreate(false);
                        handleCreateConversation(selectedUsers);
                    }}
                />
            </SafeAreaView>
        </AppLayout>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    conversationPanel: {
        flex: 1,
        backgroundColor: 'transparent',
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
    emptyStateIconWrapper: {
        marginBottom: theme.spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateIconBackground: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: `${theme.colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
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
    actionPanelsContainer: {
        marginTop: theme.spacing.xl,
        gap: theme.spacing.md,
        width: '100%',
        maxWidth: 280,
    },
    actionPanel: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: theme.borderWidth.thin,
        borderColor: theme.colors.borderLight,
    },
    actionPanelPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.98 }],
    },
    actionPanelIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    actionPanelTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    actionPanelSubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
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
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        gap: theme.spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    processingContent: {
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    processingText: {
        fontSize: 16,
        fontWeight: '500',
        fontFamily: theme.fonts.medium,
        color: theme.colors.text,
        marginTop: theme.spacing.sm,
    },
});