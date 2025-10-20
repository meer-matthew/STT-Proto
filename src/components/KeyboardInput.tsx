import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
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
    const { addMessage } = useConversation();
    const theme = useTheme();

    const handleSend = () => {
        if (text.trim() && conversationId) {
            const messageText = text.trim();
            const messageId = addMessage(conversationId, username, 'user', messageText, false);
            setText('');

            // Trigger TTS callback if provided
            if (onMessageSent && messageId) {
                onMessageSent(messageText, messageId);
            }
        }
    };

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <TouchableOpacity
                    style={[styles.floatingButton, isRecording && styles.floatingButtonActive]}
                    onPress={onMicPress}
                    activeOpacity={0.7}>
                    <Icon name={isRecording ? "stop" : "microphone"} size={24} color="#fff" />
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    placeholder="Enter your message..."
                    placeholderTextColor="#999"
                    value={text}
                    onChangeText={setText}
                    multiline
                    maxLength={500}
                />

                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSend}
                    disabled={!text.trim()}
                    activeOpacity={0.7}>
                    <Icon name="send" size={18} color="#fff" />
                </TouchableOpacity>
            </View>


        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
        backgroundColor: theme.colors.white,
        alignItems: 'flex-end',
        gap: theme.spacing.sm,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 25,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    attachButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text,
        maxHeight: 100,
        paddingVertical: 8,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingButton: {
        width: 50,
        height: 50,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    floatingButtonActive: {
        backgroundColor: theme.colors.error,
    },
});