import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useConversation } from '../context/ConversationContext';
import { useTheme } from '../context/ThemeContext';

type KeyboardInputProps = {
    username: string;
    conversationId: string | null;
    onMicPress: () => void;
    isRecording: boolean;
    onMessageSent?: (messageText: string, messageId: string) => void;
};

export function KeyboardInput({ username, conversationId, onMicPress, isRecording, onMessageSent }: KeyboardInputProps) {
    const [text, setText] = useState('');
    const [showKeyboard, setShowKeyboard] = useState(false);
    const { addMessage, addMessageWithStream } = useConversation();
    const theme = useTheme();

    // Animation values
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const recordingPulse = useRef(new Animated.Value(1)).current;

    // Recording pulse animation
    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(recordingPulse, {
                        toValue: 1.15,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(recordingPulse, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            recordingPulse.setValue(1);
        }
    }, [isRecording, recordingPulse]);

    // Mode toggle animation
    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: showKeyboard ? 1 : 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
        }).start();
    }, [showKeyboard, slideAnim]);

    const handleSend = async () => {
        if (text.trim() && conversationId) {
            const messageText = text.trim();
            setText('');

            // Use streaming to send message - this enables real-time updates
            const messageId = await addMessageWithStream(conversationId, username, 'user', messageText, false);

            // Trigger TTS callback if provided
            if (onMessageSent && messageId) {
                onMessageSent(messageText, messageId);
            }
        }
    };

    const toggleInputMode = () => {
        setShowKeyboard(!showKeyboard);
    };

    const handleMicPress = () => {
        // Quick scale animation on press
        Animated.sequence([
            Animated.timing(pulseAnim, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
        onMicPress();
    };

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            {!showKeyboard ? (
                // Microphone Mode (Default)
                <View style={styles.micModeWrapper}>
                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={toggleInputMode}
                        activeOpacity={0.7}>
                        <Icon name="keyboard-o" size={22} color={theme.colors.textSecondary} />
                        <View style={styles.toggleIndicator} />
                    </TouchableOpacity>

                    <Animated.View style={{
                        alignItems: 'center',
                        transform: [
                            { scale: Animated.multiply(pulseAnim, recordingPulse) }
                        ]
                    }}>
                        <TouchableOpacity
                            style={[styles.largeMicButton, isRecording && styles.largeMicButtonActive]}
                            onPress={handleMicPress}
                            activeOpacity={0.8}>
                            <Animated.View style={[
                                styles.micIconWrapper,
                                isRecording && styles.micIconWrapperActive,
                            ]}>
                                <Icon name={isRecording ? "stop-circle" : "microphone"} size={52} color="#fff" />
                            </Animated.View>
                        </TouchableOpacity>
                        <Text style={styles.micButtonText}>
                            {isRecording ? "STOP RECORDING" : "TAP TO SPEAK"}
                        </Text>
                    </Animated.View>
                </View>
            ) : (
                // Keyboard Mode
                <Animated.View style={[styles.keyboardModeContainer, {
                    opacity: slideAnim,
                    transform: [{
                        translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                        })
                    }]
                }]}>
                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={toggleInputMode}
                        activeOpacity={0.7}>
                        <Icon name="microphone" size={20} color={theme.colors.textSecondary} />
                        <View style={styles.toggleIndicator} />
                    </TouchableOpacity>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type your message..."
                            placeholderTextColor="#999"
                            value={text}
                            onChangeText={setText}
                            multiline
                            maxLength={500}
                            autoFocus
                        />

                        <TouchableOpacity
                            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={!text.trim()}
                            activeOpacity={0.7}>
                            <Icon name="send" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    micModeWrapper: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    keyboardModeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    toggleButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e8e8e8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        position: 'relative',
        alignSelf: 'flex-start',
    },
    toggleIndicator: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
    },
    largeMicButton: {
        width: 140,
        height: 140,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    largeMicButtonActive: {
        backgroundColor: theme.colors.error,
        shadowColor: theme.colors.error,
        borderColor: 'rgba(255, 255, 255, 0.35)',
    },
    micIconWrapper: {
        width: 75,
        height: 75,
        borderRadius: 37.5,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    micIconWrapperActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    micButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.text,
        letterSpacing: 1,
        marginTop: theme.spacing.md,
        textAlign: 'center',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 26,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 10,
        borderWidth: 2,
        borderColor: '#e8e8e8',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
        maxHeight: 100,
        paddingVertical: 8,
        fontWeight: '500',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    sendButtonDisabled: {
        backgroundColor: '#d0d0d0',
        shadowOpacity: 0.1,
    },
});