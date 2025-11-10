import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

type SpeakingIndicatorProps = {
    text: string;
    onCancel?: () => void;
    isListening?: boolean; // Whether actively listening for audio
};

export function SpeechIndicator({ text, onCancel, isListening = false }: SpeakingIndicatorProps) {
    // Animate dots pulsing
    const dot1Anim = useRef(new Animated.Value(0.6)).current;
    const dot2Anim = useRef(new Animated.Value(0.6)).current;
    const dot3Anim = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        // Create staggered pulsing animation for the dots
        const animateDot = (animValue: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(animValue, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(animValue, {
                        toValue: 0.6,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        const anim1 = animateDot(dot1Anim, 0);
        const anim2 = animateDot(dot2Anim, 150);
        const anim3 = animateDot(dot3Anim, 300);

        anim1.start();
        anim2.start();
        anim3.start();

        return () => {
            anim1.stop();
            anim2.stop();
            anim3.stop();
        };
    }, [dot1Anim, dot2Anim, dot3Anim]);

    // Determine if there's live transcription happening
    const hasTranscription = text && text.trim() !== 'Listening...' && text.trim() !== '';
    const statusText = isListening
        ? (hasTranscription ? 'Transcribing Live...' : 'Listening...')
        : 'Processing...';

    return (
        <View style={styles.container}>
            <View style={[styles.bubble, isListening && styles.bubbleActive]}>
                {/* Header with animated dots and status */}
                <View style={styles.header}>
                    <View style={styles.dots}>
                        <Animated.View
                            style={[
                                styles.dot,
                                styles.dotActive,
                                { opacity: dot1Anim }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.dot,
                                styles.dotActive,
                                { opacity: dot2Anim }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.dot,
                                styles.dotActive,
                                { opacity: dot3Anim }
                            ]}
                        />
                    </View>
                    <Text style={[styles.statusText, hasTranscription && styles.statusTextActive]}>
                        {statusText}
                    </Text>
                    {onCancel && (
                        <TouchableOpacity
                            style={[styles.cancelButton, isListening && styles.cancelButtonActive]}
                            onPress={onCancel}
                            activeOpacity={0.7}>
                            <Icon name="times" size={14} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Live transcription text with visual indicator */}
                {hasTranscription ? (
                    <View style={styles.transcriptionContainer}>
                        <Icon name="quote-left" size={12} color="rgba(90, 100, 112, 0.3)" />
                        <Text style={styles.text}>{text}</Text>
                        <Icon name="quote-right" size={12} color="rgba(90, 100, 112, 0.3)" />
                    </View>
                ) : (
                    <Text style={styles.listeningPlaceholder}>
                        {text}
                    </Text>
                )}
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    bubble: {
        backgroundColor: '#f0f8ff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#e0e8f0',
    },
    bubbleActive: {
        backgroundColor: '#e8f4ff',
        borderColor: '#5a6470',
        shadowColor: '#5a6470',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    dots: {
        flexDirection: 'row',
        gap: 4,
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 24,
        borderRadius: 4,
    },
    dotActive: {
        backgroundColor: '#5a6470',
    },
    statusText: {
        fontSize: 13,
        color: '#888',
        flex: 1,
        fontWeight: '500',
    },
    statusTextActive: {
        color: '#5a6470',
        fontWeight: '600',
    },
    cancelButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#999',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonActive: {
        backgroundColor: '#d32f2f',
    },
    transcriptionContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    text: {
        fontSize: 16,
        color: '#000',
        lineHeight: 22,
        flex: 1,
        fontWeight: '500',
    },
    listeningPlaceholder: {
        fontSize: 15,
        color: '#999',
        lineHeight: 20,
        fontStyle: 'italic',
    },
});