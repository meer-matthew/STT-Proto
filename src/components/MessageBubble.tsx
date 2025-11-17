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

// Color palette for random message backgrounds - more saturated, vibrant colors
// NOTE: Red is excluded as it's reserved for error states
const COLOR_PALETTE = [
    '#2A9D8F', // Deep Teal
    '#0077B6', // Deep Blue
    '#FF6B35', // Deep Orange
    '#06A77D', // Deep Green
    '#7209B7', // Deep Purple
    '#00B4D8', // Cyan
    '#FB5607', // Vibrant Orange
    '#3A0CA3', // Deep Indigo
    '#EC4899', // Hot Pink
    '#059669', // Forest Green
];

// Generate consistent color based on username
const getColorForUser = (username: string): string => {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        const char = username.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
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

    // Get consistent color for this user
    const userColor = getColorForUser(name);

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
                    !isCurrentUser && {
                        backgroundColor: userColor,
                        shadowColor: userColor,
                        elevation: 6,
                    },
                    isSpeaking && styles.bubblePlaying,
                    isStreaming && [styles.bubbleStreaming, isCurrentUser && styles.bubbleStreamingSender]
                ]}>
                    <Text style={[
                        styles.message,
                        isCurrentUser && styles.senderMessage,
                        !isCurrentUser && styles.receiverMessage,
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
        marginBottom: 18,
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    senderContainer: {
        flexDirection: 'row-reverse',
    },
    avatarContainer: {
        paddingTop: 0,
        justifyContent: 'flex-start',
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
        marginBottom: 8,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: theme.fonts.bold,
        color: theme.colors.text,
        letterSpacing: 0.3,
    },
    time: {
        fontSize: 13,
        fontWeight: '400',
        fontFamily: theme.fonts.regular,
        color: '#999',
    },
    audioButton: {
        padding: theme.spacing.xs,
        minWidth: 48,
        minHeight: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 'auto',
    },
    audioButtonActive: {
        backgroundColor: theme.colors.errorLight,
        borderRadius: theme.borderRadius.sm,
    },
    bubble: {
        backgroundColor: theme.colors.white,
        borderRadius: 24,
        borderTopLeftRadius: 6,
        padding: 28,
        paddingVertical: 22,
        maxWidth: '78%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    senderBubble: {
        backgroundColor: theme.colors.primary,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 6,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    message: {
        fontSize: 24,
        fontWeight: '600',
        fontFamily: theme.fonts.bold,
        color: theme.colors.text,
        lineHeight: 36,
        letterSpacing: 0.3,
    },
    senderMessage: {
        color: theme.colors.white,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    receiverMessage: {
        color: '#FFFFFF',
        fontWeight: '700', // Extra bold for contrast
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    bubblePlaying: {
        borderWidth: 2.5,
        borderColor: theme.colors.primary,
    },
    messagePlaying: {
        fontWeight: '600',
    },
    bubbleStreaming: {
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    bubbleStreamingSender: {
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    streamingDots: {
        fontSize: 20,
        fontWeight: '400',
        color: theme.colors.primary,
        marginLeft: 6,
    },
});