import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AvatarIcon } from './icons/AvatarIcon';
import { useTheme } from '../context/ThemeContext';

type MessageBubbleProps = {
    name: string;
    time: string;
    message: string;
    isCurrentUser?: boolean;
    hasAudio?: boolean;
    onPlayAudio?: () => void;
    isSpeaking?: boolean;
};

export function MessageBubble({
                                  name,
                                  time,
                                  message,
                                  isCurrentUser = false,
                                  hasAudio = false,
                                  onPlayAudio,
                                  isSpeaking = false
                              }: MessageBubbleProps) {
    const theme = useTheme();
    const styles = createStyles(theme);

    return (
        <View style={[styles.container, isCurrentUser && styles.senderContainer]}>
            <View style={styles.avatarContainer}>
                <AvatarIcon variant="small" />
            </View>
            <View style={[styles.bubbleWrapper, isCurrentUser && styles.senderBubbleWrapper]}>
                <View style={styles.header}>
                    {!isCurrentUser && (
                        <>
                            <Text style={styles.name}>{name}</Text>
                            <Text style={styles.time}>{time}</Text>
                        </>
                    )}
                    {isCurrentUser && (
                        <>
                            <Text style={styles.time}>{time}</Text>
                            <Text style={styles.name}>{name}</Text>
                        </>
                    )}
                    <TouchableOpacity
                        style={[styles.audioButton, isSpeaking && styles.audioButtonActive]}
                        onPress={onPlayAudio}>
                        <Icon
                            name={isSpeaking ? "stop" : "volume-up"}
                            size={16}
                            color={isSpeaking ? "#e74c3c" : "#5a6470"}
                        />
                    </TouchableOpacity>
                </View>
                <View style={[styles.bubble, isCurrentUser && styles.senderBubble]}>
                    <Text style={[styles.message, isCurrentUser && styles.senderMessage]}>
                        {message}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    senderContainer: {
        flexDirection: 'row-reverse',
    },
    avatarContainer: {
        paddingTop: 8,
    },
    bubbleWrapper: {
        flex: 1,
        alignItems: 'flex-start',
    },
    senderBubbleWrapper: {
        alignItems: 'flex-end',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    time: {
        fontSize: 13,
        fontWeight: '400',
        color: '#999',
    },
    audioButton: {
        padding: theme.spacing.xs,
        minWidth: 44,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    audioButtonActive: {
        backgroundColor: theme.colors.errorLight,
        borderRadius: theme.borderRadius.sm,
    },
    bubble: {
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        borderTopLeftRadius: 4,
        padding: 16,
        maxWidth: '75%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    senderBubble: {
        backgroundColor: theme.colors.primary,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 4,
    },
    message: {
        fontSize: 16,
        fontWeight: '400',
        color: theme.colors.text,
        lineHeight: 22,
    },
    senderMessage: {
        color: theme.colors.white,
    },
});