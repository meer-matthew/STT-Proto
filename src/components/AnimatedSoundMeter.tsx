import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { VADState } from '../hooks/useSpeechToText';

type AnimatedSoundMeterProps = {
    level: number; // 0-10 scale
    vadState: VADState; // 'idle' | 'listening' | 'recording' | 'processing'
};

export function AnimatedSoundMeter({ level, vadState }: AnimatedSoundMeterProps) {
    const theme = useTheme();
    const pulseAnim = useRef(new Animated.Value(0.8)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Determine colors based on VAD state
    const getStatusColor = () => {
        switch (vadState) {
            case 'listening':
                return theme.colors.warning; // Yellow for listening
            case 'recording':
                return theme.colors.primary; // Blue for recording
            case 'processing':
                return theme.colors.info || theme.colors.primary; // Cyan/Blue for processing
            default:
                return theme.colors.borderLight; // Gray for idle
        }
    };

    const getStatusText = () => {
        switch (vadState) {
            case 'listening':
                return 'Listening...';
            case 'recording':
                return 'Recording';
            case 'processing':
                return 'Processing...';
            default:
                return '';
        }
    };

    // Pulsing animation for listening state
    useEffect(() => {
        if (vadState === 'listening') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 600,
                        useNativeDriver: false,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0.8,
                        duration: 600,
                        useNativeDriver: false,
                    }),
                ]),
            ).start();
        } else {
            pulseAnim.setValue(0.8);
        }
    }, [vadState, pulseAnim]);

    // Scale animation based on audio level
    useEffect(() => {
        const normalizedLevel = Math.min(Math.max(level * 10, 0), 100);
        const targetScale = 0.8 + (normalizedLevel / 100) * 0.4; // Scale between 0.8 and 1.2

        Animated.timing(scaleAnim, {
            toValue: targetScale,
            duration: 100,
            useNativeDriver: false,
        }).start();
    }, [level, scaleAnim]);

    // Don't show if idle
    if (vadState === 'idle') {
        return null;
    }

    const statusColor = getStatusColor();
    const statusText = getStatusText();
    const normalizedLevel = Math.min(Math.max(level * 10, 0), 100);

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            {/* Animated waveform indicator */}
            <Animated.View
                style={[
                    styles.waveformContainer,
                    {
                        transform: [{ scale: scaleAnim }],
                        opacity: pulseAnim,
                    },
                ]}
            >
                {/* Center dot */}
                <View
                    style={[
                        styles.centerDot,
                        { backgroundColor: statusColor },
                    ]}
                />

                {/* Outer rings for waveform effect */}
                <View
                    style={[
                        styles.ring,
                        styles.ring1,
                        { borderColor: statusColor },
                    ]}
                />
                <View
                    style={[
                        styles.ring,
                        styles.ring2,
                        { borderColor: statusColor, opacity: 0.6 },
                    ]}
                />
            </Animated.View>

            {/* Status text and meter */}
            <View style={styles.statusContainer}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                    {statusText}
                </Text>

                {/* Audio level meter bar */}
                <View style={styles.meterBackground}>
                    <Animated.View
                        style={[
                            styles.meterFill,
                            {
                                width: `${normalizedLevel}%`,
                                backgroundColor: statusColor,
                            },
                        ]}
                    />
                </View>

                {/* Audio level number */}
                <Text style={[styles.levelText, { color: statusColor }]}>
                    {Math.round(level * 10)}%
                </Text>
            </View>
        </View>
    );
}

const createStyles = (theme: any) =>
    StyleSheet.create({
        container: {
            marginHorizontal: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
            alignItems: 'center',
        },
        waveformContainer: {
            width: 80,
            height: 80,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.spacing.md,
        },
        centerDot: {
            width: 16,
            height: 16,
            borderRadius: 8,
            position: 'absolute',
        },
        ring: {
            position: 'absolute',
            borderWidth: 2,
            borderRadius: 50,
        },
        ring1: {
            width: 40,
            height: 40,
        },
        ring2: {
            width: 60,
            height: 60,
        },
        statusContainer: {
            width: '100%',
        },
        statusText: {
            fontSize: 14,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: theme.spacing.sm,
        },
        meterBackground: {
            height: 8,
            backgroundColor: theme.colors.borderLight,
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: theme.spacing.xs,
        },
        meterFill: {
            height: '100%',
            borderRadius: 4,
        },
        levelText: {
            fontSize: 12,
            textAlign: 'center',
            fontWeight: '500',
        },
    });