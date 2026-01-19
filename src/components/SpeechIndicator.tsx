import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';

// Detect if device is a tablet
const isTablet = () => {
    const { width, height } = Dimensions.get('window');
    const diagonal = Math.sqrt(width * width + height * height);
    return diagonal > 1200;
};

// Detect if device is in landscape mode
const isLandscape = () => {
    const { width, height } = Dimensions.get('window');
    return width > height;
};

type SpeakingIndicatorProps = {
    text: string;
    onCancel?: () => void;
    isListening?: boolean; // Whether actively listening for audio
};

export function SpeechIndicator({ text, onCancel, isListening = false }: SpeakingIndicatorProps) {
    const theme = useTheme();
    const styles = createStyles(theme);

    // Animate waveform dots with smooth pulsing
    const dot1Anim = useRef(new Animated.Value(0.4)).current;
    const dot2Anim = useRef(new Animated.Value(0.4)).current;
    const dot3Anim = useRef(new Animated.Value(0.4)).current;
    const dot4Anim = useRef(new Animated.Value(0.4)).current;
    const dot5Anim = useRef(new Animated.Value(0.4)).current;

    // Microphone scale animation
    const micScaleAnim = useRef(new Animated.Value(1)).current;

    // Word-by-word animation
    const [displayedText, setDisplayedText] = useState('');
    const [words, setWords] = useState<string[]>([]);
    const [wordKeys, setWordKeys] = useState<string[]>([]); // Stable keys for each word
    const wordOpacityAnims = useRef<Animated.Value[]>([]).current;
    const cursorOpacity = useRef(new Animated.Value(1)).current;
    const previousTextRef = useRef('');
    // Use timestamp + counter to ensure globally unique keys even across resets
    const wordCounterRef = useRef(0);
    const instanceIdRef = useRef(Date.now()); // Unique ID for this component instance

    // Waveform animation - creates smooth pulsing effect
    useEffect(() => {
        if (!isListening) {
            // Reset animations when not listening
            Animated.parallel([
                Animated.timing(dot1Anim, { toValue: 0.4, duration: 300, useNativeDriver: true }),
                Animated.timing(dot2Anim, { toValue: 0.4, duration: 300, useNativeDriver: true }),
                Animated.timing(dot3Anim, { toValue: 0.4, duration: 300, useNativeDriver: true }),
                Animated.timing(dot4Anim, { toValue: 0.4, duration: 300, useNativeDriver: true }),
                Animated.timing(dot5Anim, { toValue: 0.4, duration: 300, useNativeDriver: true }),
                Animated.timing(micScaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();
            return;
        }

        // Create waveform animation with staggered dots
        const waveAnimation = Animated.loop(
            Animated.sequence([
                // Wave up
                Animated.stagger(50, [
                    Animated.timing(dot1Anim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot2Anim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot3Anim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot4Anim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot5Anim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]),
                // Wave down
                Animated.stagger(50, [
                    Animated.timing(dot1Anim, {
                        toValue: 0.4,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot2Anim, {
                        toValue: 0.4,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot3Anim, {
                        toValue: 0.4,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot4Anim, {
                        toValue: 0.4,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot5Anim, {
                        toValue: 0.4,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );

        // Microphone pulse animation
        const micPulse = Animated.loop(
            Animated.sequence([
                Animated.timing(micScaleAnim, {
                    toValue: 1.1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(micScaleAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        );

        Animated.parallel([waveAnimation, micPulse]).start();

        return () => {
            waveAnimation.stop();
            micPulse.stop();
        };
    }, [isListening, dot1Anim, dot2Anim, dot3Anim, dot4Anim, dot5Anim, micScaleAnim]);

    // Cursor blinking animation
    useEffect(() => {
        if (!isListening) return;

        const cursorAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(cursorOpacity, {
                    toValue: 0.3,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(cursorOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        );

        cursorAnimation.start();
        return () => cursorAnimation.stop();
    }, [isListening, cursorOpacity]);

    // Border pulse animation for message preview
    const borderPulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!hasTranscription) return;

        const borderPulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(borderPulseAnim, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: false, // borderWidth doesn't support native driver
                }),
                Animated.timing(borderPulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: false,
                }),
            ])
        );

        borderPulseAnimation.start();
        return () => borderPulseAnimation.stop();
    }, [hasTranscription, borderPulseAnim]);

    // Handle word-by-word animation when text changes
    useEffect(() => {
        if (!text || text.trim() === 'Listening...') {
            setDisplayedText('');
            setWords([]);
            setWordKeys([]);
            previousTextRef.current = '';
            return;
        }

        // Get new words that weren't in the previous text
        const currentWords = text.trim().split(/\s+/);
        const previousWords = previousTextRef.current.trim().split(/\s+/).filter(w => w);

        // Determine which words are new
        const newWordCount = currentWords.length - previousWords.length;

        if (newWordCount > 0) {
            // New words added - animate them in
            setWords(currentWords);

            // Generate stable, globally unique keys for each word
            // Use instanceId to ensure no collisions across different component instances
            let newKeys: string[];

            if (wordKeys.length === previousWords.length && wordKeys.length > 0) {
                // Keys are in sync, keep existing keys and add new ones
                newKeys = [...wordKeys];
            } else {
                // Keys are out of sync or don't exist, regenerate all from scratch
                newKeys = [];
            }

            // Add keys for new words (using instanceId + counter ensures global uniqueness)
            for (let i = newKeys.length; i < currentWords.length; i++) {
                newKeys.push(`${instanceIdRef.current}-word-${wordCounterRef.current++}`);
            }
            setWordKeys(newKeys);

            // Create or update opacity animations for new words
            while (wordOpacityAnims.length < currentWords.length) {
                wordOpacityAnims.push(new Animated.Value(0));
            }

            // Animate new words in with staggered timing
            const animations = wordOpacityAnims
                .slice(previousWords.length)
                .map((anim, index) =>
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 200,
                        delay: index * 50, // Stagger each word by 50ms
                        useNativeDriver: true,
                    })
                );

            Animated.parallel(animations).start();
        } else if (currentWords.length > 0) {
            // Text updated but same number of words - show all at once
            setWords(currentWords);

            // Ensure we have keys for all words
            if (wordKeys.length < currentWords.length) {
                const newKeys = [...wordKeys];
                for (let i = newKeys.length; i < currentWords.length; i++) {
                    newKeys.push(`${instanceIdRef.current}-word-${wordCounterRef.current++}`);
                }
                setWordKeys(newKeys);
            }

            wordOpacityAnims.forEach(anim => {
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 0,
                    useNativeDriver: true,
                }).start();
            });
        }

        previousTextRef.current = text;
    }, [text, isListening]);

    // Update displayed text - show all words that have opacity animations
    useEffect(() => {
        if (words.length > 0) {
            setDisplayedText(words.join(' '));
        }
    }, [words]);

    // Determine if there's live transcription happening
    const hasTranscription = text && text.trim() !== 'Listening...' && text.trim() !== '';

    // Show transcript preview in status text (first 40 chars) or default status
    const getStatusText = () => {
        console.log("TEXT: ", text)
        if (!isListening) return 'Processing...';
        if (hasTranscription) {
            // Show first few words of the transcript in the status
            const previewLength = 40;
            return text.length > previewLength
                ? text.substring(0, previewLength) + '...'
                : text;
        }
        return 'Listening...';
    };

    const statusText = getStatusText();

    // Render animated words with staggered opacity
    const renderAnimatedText = () => {
        if (!hasTranscription) return null;

        return (
            <View style={styles.animatedWordsContainer}>
                {words.map((word, index) => {
                    // Always use the stored key - should never be undefined
                    const key = wordKeys[index] || `${instanceIdRef.current}-fallback-${index}`;
                    return (
                        <Animated.Text
                            key={key}
                            style={[
                                styles.animatedWord,
                                {
                                    opacity: wordOpacityAnims[index] || new Animated.Value(1),
                                },
                            ]}>
                            {word}{' '}
                        </Animated.Text>
                    );
                })}
                {/* Blinking cursor */}
                <Animated.Text
                    style={[
                        styles.cursor,
                        {
                            opacity: cursorOpacity,
                        },
                    ]}>
                    |
                </Animated.Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.bubble, isListening && styles.bubbleActive]}>
                {/* Header with animated dots and status */}
                <View style={styles.header}>
                    {/* Animated Microphone Icon */}
                    <Animated.View
                        style={[
                            styles.micIconContainer,
                            {
                                transform: [{ scale: micScaleAnim }],
                            }
                        ]}>
                        <Icon name="microphone" size={isTablet() && isLandscape() ? 13 : 16} color="#4a90e2" />
                    </Animated.View>

                    {/* Animated Waveform Dots */}
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
                        <Animated.View
                            style={[
                                styles.dot,
                                styles.dotActive,
                                { opacity: dot4Anim }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.dot,
                                styles.dotActive,
                                { opacity: dot5Anim }
                            ]}
                        />
                    </View>

                    <Text style={styles.statusLabel}>
                        {hasTranscription ? 'Recording...' : 'Listening...'}
                    </Text>

                    {onCancel && (
                        <TouchableOpacity
                            style={[styles.cancelButton, isListening && styles.cancelButtonActive]}
                            onPress={onCancel}
                            activeOpacity={0.7}>
                            <Icon name="times" size={isTablet() && isLandscape() ? 11 : 14} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Live Transcript Display */}
                {hasTranscription ? (
                    <View style={styles.liveTranscriptContainer}>
                        <Text style={styles.liveTranscriptText}>
                            {text}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.listeningPlaceholder}>
                        Start speaking...
                    </Text>
                )}
            </View>
        </View>
    );
}


const createStyles = (theme: any) => {
    const tablet = isTablet();
    const landscape = isLandscape();
    const tabletLandscape = tablet && landscape;

    return StyleSheet.create({
        container: {
            paddingHorizontal: theme.spacing.lg,
            marginBottom: tabletLandscape ? 8 : 16,
        },
        bubble: {
            backgroundColor: '#f0f8ff',
            borderRadius: 16,
            padding: tabletLandscape ? 10 : 16,
        },
        bubbleActive: {
            backgroundColor: '#e8f4ff',
            shadowColor: '#5a6470',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: tabletLandscape ? 6 : 10,
            marginBottom: tabletLandscape ? 6 : 12,
        },
        micIconContainer: {
            width: tabletLandscape ? 24 : 28,
            height: tabletLandscape ? 24 : 28,
            borderRadius: tabletLandscape ? 12 : 14,
            backgroundColor: 'rgba(74, 144, 226, 0.15)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        dots: {
            flexDirection: 'row',
            gap: tabletLandscape ? 2 : 4,
            alignItems: 'center',
        },
        dot: {
            width: tabletLandscape ? 5 : 8,
            height: tabletLandscape ? 16 : 24,
            borderRadius: 3,
        },
        dotActive: {
            backgroundColor: '#5a6470',
        },
        statusLabel: {
            fontSize: tabletLandscape ? 11 : 13,
            fontFamily: theme.fonts.medium,
            color: '#5a6470',
            flex: 1,
            fontWeight: '600',
        },
        cancelButton: {
            width: tabletLandscape ? 24 : 28,
            height: tabletLandscape ? 24 : 28,
            borderRadius: tabletLandscape ? 12 : 14,
            backgroundColor: '#999',
            justifyContent: 'center',
            alignItems: 'center',
        },
        cancelButtonActive: {
            backgroundColor: '#d32f2f',
        },
        messagePreview: {
            marginTop: tabletLandscape ? 6 : 12,
        },
        messagePreviewLabel: {
            fontSize: tabletLandscape ? 10 : 12,
            fontFamily: theme.fonts.medium,
            color: '#888',
            marginBottom: tabletLandscape ? 4 : 6,
            fontWeight: '500',
        },
        messagePreviewBubble: {
            backgroundColor: theme.colors.primary,
            borderRadius: 24,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 6, // Sharp corner like sent message
            padding: tabletLandscape ? 28 : 22,
            paddingVertical: tabletLandscape ? 22 : 18,
            maxWidth: '85%',
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 10,
            elevation: 6,
        },
        transcriptionContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
        },
        text: {
            fontSize: tabletLandscape ? 13 : 16,
            fontFamily: theme.fonts.regular,
            color: '#000',
            lineHeight: tabletLandscape ? 18 : 22,
            flex: 1,
            fontWeight: '500',
        },
        animatedWordsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            flex: 1,
            gap: 0,
        },
        animatedWord: {
            fontSize: tablet ? 28 : 24,
            fontFamily: theme.fonts.bold,
            color: theme.colors.white,
            fontWeight: '600',
            lineHeight: tablet ? 42 : 36,
            letterSpacing: 0.3,
            textShadowColor: 'rgba(0, 0, 0, 0.2)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
        },
        cursor: {
            fontSize: tablet ? 28 : 24,
            fontFamily: theme.fonts.bold,
            color: theme.colors.white,
            fontWeight: '600',
            marginLeft: 2,
            textShadowColor: 'rgba(0, 0, 0, 0.2)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
        },
        listeningPlaceholder: {
            fontSize: tabletLandscape ? 12 : 15,
            fontFamily: theme.fonts.regular,
            color: '#999',
            lineHeight: tabletLandscape ? 16 : 20,
            fontStyle: 'italic',
        },
        liveTranscriptContainer: {
            paddingVertical: tabletLandscape ? 8 : 12,
        },
        liveTranscriptText: {
            fontSize: tabletLandscape ? 14 : 16,
            fontFamily: theme.fonts.medium,
            color: '#2c3e50',
            lineHeight: tabletLandscape ? 20 : 24,
            fontWeight: '500',
        },
    });
};