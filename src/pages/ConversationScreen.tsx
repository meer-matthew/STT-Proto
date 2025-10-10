import React, { useRef, useEffect, useState } from 'react';
import {
    StatusBar,
    useColorScheme,
    View,
    ScrollView,
    Alert,
    Text,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ConfigurationHeader } from '../components/ConfigurationHeader';
import { MessageBubble } from '../components/MessageBubble';
import { KeyboardInput } from '../components/KeyboardInput';
import { ConversationList } from '../components/ConversationList';
import { SoundMeter } from '../components/SoundMeter';
import { useConversation } from '../context/ConversationContext';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { conversationStyles } from '../styles/conversationStyles';
import { SpeechIndicator } from '../components/SpeechIndicator';
import Icon from 'react-native-vector-icons/FontAwesome';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversation'>;

export function ConversationScreen({ navigation, route }: Props) {
    const isDarkMode = useColorScheme() === 'dark';
    const { username, configuration } = route.params;
    const scrollViewRef = useRef<ScrollView>(null);
    const [showConversationList, setShowConversationList] = useState(true);

    const { createConversation, addMessage, getMessages, setCurrentConversation, getCurrentConversation } = useConversation();
    const [conversationId, setConversationId] = useState<string | null>(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const messages = conversationId ? getMessages(conversationId) : [];

    // Create conversation on mount
    useEffect(() => {
        const id = createConversation(username, configuration);
        setConversationId(id);
    }, []);

    const handleSelectConversation = (id: string) => {
        setCurrentConversation(id);
        setConversationId(id);
    };

    const toggleConversationList = () => {
        setShowConversationList(!showConversationList);
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

    // Check if speech recognition is available
    useEffect(() => {
        if (!isAvailable) {
            Alert.alert(
                'Speech Recognition Unavailable',
                'Speech-to-text is not available on this device. You can still use keyboard input.'
            );
        }
    }, [isAvailable]);

    const handleMicPress = async () => {
        if (isRecording) {
            await stopRecording();
            // Add the message when recording stops
            if (transcript.trim() && conversationId) {
                addMessage(conversationId, username, 'user', transcript.trim(), true);
            }
        } else {
            await startRecording();
        }
    };

    const handleCancelRecording = async () => {
        await cancelRecording();
    };

    const handlePlayAudio = (messageId: string, messageText: string) => {
        if (currentlySpeakingId === messageId && isSpeaking) {
            // If this message is currently speaking, stop it
            stop();
        } else {
            // Otherwise, speak this message
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

    // Parse configuration to get caregiver count
    const caregiverCount = parseInt(configuration.split(':')[0]) || 1;

    return (
        <View style={conversationStyles.container}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            <View style={conversationStyles.splitContainer}>
                {/* Conversation List - 1/3 width */}
                {showConversationList && (
                    <View style={conversationStyles.conversationListPanel}>
                        <ConversationList
                            onSelectConversation={handleSelectConversation}
                            selectedConversationId={conversationId}
                        />
                    </View>
                )}

                {/* Main Conversation Area - 2/3 width */}
                <View style={conversationStyles.conversationPanel}>
                    <View style={conversationStyles.conversationHeader}>
                        <TouchableOpacity
                            style={conversationStyles.toggleButton}
                            onPress={toggleConversationList}
                            activeOpacity={0.7}>
                            <Icon name={showConversationList ? 'chevron-left' : 'bars'} size={18} color="#666" />
                        </TouchableOpacity>
                        <ConfigurationHeader configuration={configuration} caregiverCount={caregiverCount} />
                    </View>

                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={conversationStyles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled">
                        <View style={conversationStyles.messagesContainer}>
                            {messages.length === 0 && !isRecording ? (
                                <View style={conversationStyles.emptyStateContainer}>
                                    <Text style={conversationStyles.emptyStateTitle}>
                                        Start a Conversation
                                    </Text>
                                    <Text style={conversationStyles.emptyStateDescription}>
                                        Tap the microphone to record a voice message or type a message to begin
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
                                            isCurrentUser={message.senderType === 'user'}
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

                    <SoundMeter level={audioLevel} isRecording={isRecording} />

                    <KeyboardInput
                        username={username}
                        conversationId={conversationId}
                        onMicPress={handleMicPress}
                        isRecording={isRecording}
                    />
                </View>
            </View>
        </View>
    );
}