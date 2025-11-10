import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
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
    isStreaming?: boolean;
};

export function MessageBubble({
                                  name,
                                  time,
                                  message,
                                  isCurrentUser = false,
                                  hasAudio = false,
                                  onPlayAudio,
                                  isSpeaking = false,
                                  isStreaming = false
                              }: MessageBubbleProps) {
    const theme = useTheme();
    const styles = createStyles(theme);

    // Entrance animation
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    // Press animation
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Streaming indicator animation
    const streamingAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    useEffect(() => {
        // Streaming indicator animation - pulsing effect
        if (isStreaming) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(streamingAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(streamingAnim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [isStreaming]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    const handleAudioPress = () => {
        if (onPlayAudio) {
            onPlayAudio();
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                isCurrentUser && styles.senderContainer,
                {
                    opacity: fadeAnim,
                    transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim }
                    ]
                }
            ]}
        >
            <View style={styles.avatarContainer}>
                <AvatarIcon variant="small" />
            </View>
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.bubbleWrapper, isCurrentUser && styles.senderBubbleWrapper]}
            >
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
                        onPress={handleAudioPress}>
                        <Icon
                            name={isSpeaking ? "stop" : "volume-up"}
                            size={16}
                            color={isSpeaking ? "#e74c3c" : "#5a6470"}
                        />
                    </TouchableOpacity>
                </View>
                <View style={[
                    styles.bubble,
                    isCurrentUser && styles.senderBubble,
                    isSpeaking && styles.bubblePlaying,
                    isStreaming && [styles.bubbleStreaming, isCurrentUser && styles.bubbleStreamingSender]
                ]}>
                    <Text style={[
                        styles.message,
                        isCurrentUser && styles.senderMessage,
                        isSpeaking && styles.messagePlaying
                    ]}>
                        {message}
                        {isStreaming && <Text style={styles.streamingDots}>...</Text>}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
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
    },
    senderBubble: {
        backgroundColor: theme.colors.primary,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 4,
    },
    message: {
        fontSize: 18,
        fontWeight: '400',
        color: theme.colors.text,
        lineHeight: 26,
    },
    senderMessage: {
        color: theme.colors.white,
    },
    bubblePlaying: {
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    messagePlaying: {
        fontWeight: '700',
    },
    bubbleStreaming: {
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
    },
    bubbleStreamingSender: {
        backgroundColor: theme.colors.primary,
    },
    streamingDots: {
        fontSize: 18,
        fontWeight: '400',
        color: theme.colors.primary,
        marginLeft: 4,
    },
});