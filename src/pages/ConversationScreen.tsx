import React, { useRef, useEffect, useState } from 'react';
import {
    useColorScheme,
    View,
    ScrollView,
    Alert,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { MessageBubble } from '../components/MessageBubble';
import { KeyboardInput } from '../components/KeyboardInput';
import { ConversationList } from '../components/ConversationList';
import { SoundMeter } from '../components/SoundMeter';
import { useConversation } from '../context/ConversationContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { SpeechIndicator } from '../components/SpeechIndicator';
import { AddParticipantModal } from '../components/AddParticipantModal';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';
import { AppLayout } from '../components/AppLayout';
import { conversationService } from '../services/conversationService';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversation'>;

export function ConversationScreen({ navigation, route }: Props) {
    const isDarkMode = useColorScheme() === 'dark';
    const theme = useTheme();
    const styles = createStyles(theme);
    const { username } = route.params;
    // const { configuration } = route.params; // Commented out - configuration no longer used
    const scrollViewRef = useRef<ScrollView>(null);
    const [showConversationList, setShowConversationList] = useState(true);
    const [participants, setParticipants] = useState<any[]>([]);
    const [conversationOwner, setConversationOwner] = useState<any>(null);
    const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);

    const { createConversation, addMessage, getMessages, setCurrentConversation, getCurrentConversation, fetchUserConversations, isLoading } = useConversation();
    const [conversationId, setConversationId] = useState<string | null>(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const messages = conversationId ? getMessages(conversationId) : [];

    // Fetch user conversations on mount
    useEffect(() => {
        fetchUserConversations();
    }, []);

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
            } catch (error) {
                console.error('Failed to fetch participants:', error);
                setParticipants([]);
            }
        };

        fetchParticipants();
    }, [conversationId]);

    // Don't create conversation automatically on mount - only when + icon is clicked

    const handleSelectConversation = (id: string) => {
        setCurrentConversation(id);
        setConversationId(id);
    };

    const handleCreateConversation = async () => {
        try {
            const id = await createConversation(username, '1:1'); // Default configuration
            setConversationId(id);
            setCurrentConversation(id);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to create conversation. Please try again.');
            console.error('Create conversation error:', error);
        }
    };

    const toggleConversationList = () => {
        setShowConversationList(!showConversationList);
    };

    const handleRefreshParticipants = async () => {
        if (!conversationId) return;

        try {
            const participantsList = await conversationService.getParticipants(Number(conversationId));
            setParticipants(participantsList);
        } catch (error) {
            console.error('Failed to refresh participants:', error);
        }
    };

    const handleAddParticipantClick = () => {
        setShowAddParticipantModal(true);
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

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages, transcript]);

    // Handle errors
    useEffect(() => {
        if (error) {
            Alert.alert('Speech Recognition Error', error);
        }
    }, [error]);

    // Don't show availability alert on mount - only show errors when actually trying to use it

    const handleMicPress = async () => {
        if (isRecording) {
            await stopRecording();
            // Add the message when recording stops
            if (transcript.trim() && conversationId) {
                const messageText = transcript.trim();
                const messageId = addMessage(conversationId, username, 'user', messageText, true);

                // Automatically play TTS for the sent message
                if (messageId) {
                    // Small delay to ensure message is rendered
                    setTimeout(() => {
                        speak(messageText, messageId);
                    }, 100);
                }
            }
        } else {
            await startRecording();
        }
    };

    const handleMessageSent = (messageText: string, messageId: string) => {
        // Automatically play TTS when a text message is sent
        setTimeout(() => {
            speak(messageText, messageId);
        }, 100);
    };

    const handleCancelRecording = async () => {
        await cancelRecording();
    };

    const handlePlayAudio = (messageId: string, messageText: string) => {
        if (currentlySpeakingId === messageId && isSpeaking) {
            stop();
        } else {
            speak(messageText, messageId);
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
        <AppLayout showHeader={true} showHeaderBorder={true} navigation={navigation}>
            <SafeAreaView style={styles.flex}>
                <View style={styles.splitContainer}>
                {/* Conversation List - 1/3 width */}
                {showConversationList && (
                    <View style={styles.conversationListPanel}>
                        <ConversationList
                            onSelectConversation={handleSelectConversation}
                            selectedConversationId={conversationId}
                            onCreateConversation={handleCreateConversation}
                        />
                    </View>
                )}

                {/* Main Conversation Area - 2/3 width */}
                <KeyboardAvoidingView
                    style={styles.conversationPanel}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
                    {/* Top Navigation Bar */}
                    <View style={styles.topNavBar}>
                        <View style={styles.leftNavGroup}>
                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={toggleConversationList}
                                activeOpacity={0.7}>
                                <Icon name={showConversationList ? 'times' : 'bars'} size={20} color="#666" />
                            </TouchableOpacity>
                        </View>ple

                        {/* Center - Participants List */}
                        {conversationId && (conversationOwner || participants.length > 0) && (
                            <View style={styles.centerNavGroup}>
                                {conversationOwner && (
                                    <View style={styles.participantRow}>
                                        <Text
                                            style={styles.participantName}
                                            numberOfLines={1}
                                            ellipsizeMode="tail">
                                            {conversationOwner.username}
                                        </Text>
                                        {/*<View style={styles.rolePill}>*/}
                                        {/*    <Text style={styles.rolePillText}>*/}
                                        {/*        {conversationOwner.user_type === 'caretaker' ? 'CARETAKER' : 'USER'}*/}
                                        {/*    </Text>*/}
                                        {/*</View>*/}
                                    </View>
                                )}
                                {participants.map((participant, index) => (
                                    <View key={index} style={styles.participantRow}>
                                        <Text
                                            style={styles.participantName}
                                            numberOfLines={1}
                                            ellipsizeMode="tail">
                                            {participant.username}
                                        </Text>
                                        {/*<View style={styles.rolePill}>*/}
                                        {/*    <Text style={styles.rolePillText}>*/}
                                        {/*        {participant.user_type === 'caretaker' ? 'CARETAKER' : 'USER'}*/}
                                        {/*    </Text>*/}
                                        {/*</View>*/}
                                    </View>
                                ))}
                                <TouchableOpacity
                                    style={styles.addParticipantButton}
                                    onPress={handleAddParticipantClick}
                                    activeOpacity={0.7}>
                                    <Icon name="plus" size={16} color={theme.colors.white} />
                                </TouchableOpacity>
                            </View>
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
                                        No conversation selected
                                    </Text>
                                    <Text style={styles.emptyStateDescription}>
                                        Create a new conversation by clicking the + icon or select an existing one
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
                                            message={message.message}
                                            isCurrentUser={message.sender === username}
                                            hasAudio={message.hasAudio}
                                            onPlayAudio={() => handlePlayAudio(message.id, message.message)}
                                            isSpeaking={currentlySpeakingId === message.id && isSpeaking}
                                        />
                                    ))}
                                </>
                            )}

                            {isRecording && transcript && (
                                <SpeechIndicator
                                    text={transcript}
                                    onCancel={handleCancelRecording}
                                />
                            )}

                            {isRecording && !transcript && (
                                <SpeechIndicator
                                    text="Listening..."
                                    onCancel={handleCancelRecording}
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
                            />
                        </>
                    )}
                </KeyboardAvoidingView>
                </View>

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
            </SafeAreaView>
        </AppLayout>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    flex: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    splitContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    conversationListPanel: {
        width: '25%',
        minWidth: 250,
        maxWidth: 350,
    },
    conversationPanel: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingBottom: 20,
    },
    topNavBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    leftNavGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    centerNavGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.md,
    },
    rightNavGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: theme.spacing.md,
        maxWidth: 180,
        flexShrink: 1,
    },
    participantName: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
        color: '#1a1a1a',
        flexShrink: 1,
        maxWidth: '100%',
    },
    rolePill: {
        backgroundColor: '#e8f4f8',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        marginLeft: 6,
    },
    rolePillText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.primary,
        letterSpacing: 0.5,
    },
    toggleButton: {
        padding: theme.spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 44,
        minHeight: 44,
    },
    avatarButton: {
        padding: theme.spacing.xs,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdown: {
        position: 'absolute',
        top: 50,
        right: 0,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        minWidth: 180,
        zIndex: 1000,
    },
    dropdownHeader: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    dropdownUsername: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
        color: theme.colors.text,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
    },
    dropdownItemText: {
        fontSize: theme.fontSize.md,
        color: '#666',
    },
    conversationHeader: {
        borderBottomWidth: theme.borderWidth.thick,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.white,
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
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: theme.spacing.sm,
    },
});