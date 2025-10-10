import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AvatarIcon } from './icons/AvatarIcon';

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

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: 16,
        paddingHorizontal: 16,
        gap: 8,
    },
    senderContainer: {
        flexDirection: 'row-reverse',
    },
    avatarContainer: {
        paddingTop: 24,
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
        gap: 8,
        marginBottom: 4,
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    time: {
        fontSize: 12,
        color: '#666',
    },
    audioButton: {
        padding: 4,
    },
    audioButtonActive: {
        backgroundColor: '#ffe5e5',
        borderRadius: 4,
    },
    bubble: {
        backgroundColor: '#f5f5f5',
        borderRadius: 16,
        padding: 12,
        maxWidth: '80%',
    },
    senderBubble: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    message: {
        fontSize: 15,
        color: '#000',
        lineHeight: 20,
    },
    senderMessage: {
        textAlign: 'right',
    },
});