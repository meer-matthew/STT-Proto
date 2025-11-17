import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';

type SpeakingIndicatorProps = {
    text: string;
    onCancel?: () => void;
    isListening?: boolean; // Whether actively listening for audio
};

export function SpeechIndicator({ text, onCancel, isListening = false }: SpeakingIndicatorProps) {
    const theme = useTheme();
    const styles = createStyles(theme);

    // Animate dots pulsing
    const dot1Anim = useRef(new Animated.Value(0.6)).current;
    const dot2Anim = useRef(new Animated.Value(0.6)).current;
    const dot3Anim = useRef(new Animated.Value(0.6)).current;

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

                {/* Live transcription text with animated words and cursor */}
                {hasTranscription ? (
                    <View style={styles.transcriptionContainer}>
                        <Icon name="quote-left" size={12} color="rgba(90, 100, 112, 0.3)" />
                        {renderAnimatedText()}
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


const createStyles = (theme: any) => StyleSheet.create({
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
        fontFamily: theme.fonts.regular,
        color: '#000',
        lineHeight: 22,
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
        fontSize: 16,
        fontFamily: theme.fonts.regular,
        color: '#000',
        fontWeight: '500',
        lineHeight: 22,
    },
    cursor: {
        fontSize: 16,
        fontFamily: theme.fonts.regular,
        color: '#5a6470',
        fontWeight: '600',
        marginLeft: 2,
    },
    listeningPlaceholder: {
        fontSize: 15,
        fontFamily: theme.fonts.regular,
        color: '#999',
        lineHeight: 20,
        fontStyle: 'italic',
    },
});