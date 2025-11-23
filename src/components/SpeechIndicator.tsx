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
    const statusText = isListening
        ? (hasTranscription ? 'Transcribing Live...' : 'Listening...')
        : 'Processing...';

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

                    <Text style={[styles.statusText, hasTranscription && styles.statusTextActive]}>
                        {statusText}
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

                {/* Live transcription text with animated words and cursor */}
                {hasTranscription ? (
                    <View style={styles.transcriptionContainer}>
                        <Icon name="quote-left" size={isTablet() && isLandscape() ? 9 : 12} color="rgba(90, 100, 112, 0.3)" />
                        {renderAnimatedText()}
                        <Icon name="quote-right" size={isTablet() && isLandscape() ? 9 : 12} color="rgba(90, 100, 112, 0.3)" />
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


const createStyles = (theme: any) => {
    const tablet = isTablet();
    const landscape = isLandscape();
    const tabletLandscape = tablet && landscape;

    return StyleSheet.create({
        container: {
            paddingHorizontal: tabletLandscape ? 12 : 16,
            marginBottom: tabletLandscape ? 8 : 16,
        },
        bubble: {
            backgroundColor: '#f0f8ff',
            borderRadius: 16,
            padding: tabletLandscape ? 10 : 16,
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
        statusText: {
            fontSize: tabletLandscape ? 11 : 13,
            fontFamily: theme.fonts.medium,
            color: '#888',
            flex: 1,
            fontWeight: '500',
        },
        statusTextActive: {
            color: '#5a6470',
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
        transcriptionContainer: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: tabletLandscape ? 4 : 8,
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
            fontSize: tabletLandscape ? 13 : 16,
            fontFamily: theme.fonts.regular,
            color: '#000',
            fontWeight: '500',
            lineHeight: tabletLandscape ? 18 : 22,
        },
        cursor: {
            fontSize: tabletLandscape ? 13 : 16,
            fontFamily: theme.fonts.regular,
            color: '#5a6470',
            fontWeight: '600',
            marginLeft: 2,
        },
        listeningPlaceholder: {
            fontSize: tabletLandscape ? 12 : 15,
            fontFamily: theme.fonts.regular,
            color: '#999',
            lineHeight: tabletLandscape ? 16 : 20,
            fontStyle: 'italic',
        },
    });
};