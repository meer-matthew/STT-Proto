import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type SoundMeterProps = {
    level: number; // 0-10 scale
    isRecording: boolean;
};

export function SoundMeter({ level, isRecording }: SoundMeterProps) {
    const theme = useTheme();
    const animatedLevel = useRef(new Animated.Value(0)).current;

    // Use a dynamic range for more responsive meter (min: 1, max: 6.5 on the 0-10 scale)
    // This shows the transparent audio variations within normal speaking volume
    // Lowered max to make "too loud" detection more sensitive to shouting
    const MIN_AUDIO_LEVEL = 6.0;      // Minimum audible level
    const MAX_AUDIO_LEVEL = 7.0;    // Maximum comfortable speaking level (lower = more sensitive)
    const AUDIO_RANGE = MAX_AUDIO_LEVEL - MIN_AUDIO_LEVEL;

    // Normalize to 0-100 scale using dynamic range
    // If level is below min, show 0%; above max, show 100%
    let normalizedLevel: number;
    if (level <= MIN_AUDIO_LEVEL) {
        normalizedLevel = 0;
    } else if (level >= MAX_AUDIO_LEVEL) {
        normalizedLevel = 100;
    } else {
        // Scale the level within the dynamic range
        normalizedLevel = ((level - MIN_AUDIO_LEVEL) / AUDIO_RANGE) * 100;
    }

    // Smooth animation of meter fill - faster response for better UX
    useEffect(() => {
        Animated.spring(animatedLevel, {
            toValue: normalizedLevel,
            useNativeDriver: false,
            speed: 25,        // Increased from 12 for faster response
            bounciness: 1,    // Reduced from 3 for less bounce, more immediate feel
        }).start();
    }, [normalizedLevel, animatedLevel]);

    // Return early only AFTER all hooks have been called
    if (!isRecording) {
        return null;
    }

    // Determine color based on volume level relative to min/max audio range
    // This makes thresholds adaptive to the MIN_AUDIO_LEVEL and MAX_AUDIO_LEVEL
    const getStatusColor = () => {
        // Calculate threshold for "good" volume (70% of the way to max)
        const goodVolumeThreshold = MIN_AUDIO_LEVEL + (AUDIO_RANGE * 0.7);
        // Calculate threshold for "too loud" (90% of the way to max)
        const tooLoudThreshold = MIN_AUDIO_LEVEL + (AUDIO_RANGE * 0.9);

        // Convert these raw levels back to normalized percentages for color determination
        const normalizedGoodThreshold = ((goodVolumeThreshold - MIN_AUDIO_LEVEL) / AUDIO_RANGE) * 100;
        const normalizedTooLoudThreshold = ((tooLoudThreshold - MIN_AUDIO_LEVEL) / AUDIO_RANGE) * 100;

        if (normalizedLevel > normalizedTooLoudThreshold) return theme.colors.error;      // Too loud - shouting
        if (normalizedLevel >= normalizedGoodThreshold) return theme.colors.warning;     // Getting loud
        if (normalizedLevel > 10) return theme.colors.success;   // Good volume
        return theme.colors.secondary;                              // Quiet/below threshold
    };

    const statusColor = getStatusColor();
    const styles = createStyles(theme);

    // Interpolate width
    const meterWidth = animatedLevel.interpolate({
        inputRange: [0, 100],
        outputRange: ['100%', '0%'],
    });

    // Subtle glow opacity
    const glowOpacity = animatedLevel.interpolate({
        inputRange: [0, 100],
        outputRange: [0.2, 0.4],
    });

    return (
        <View style={styles.container}>
            {/* Minimal clean meter */}
            <View style={styles.meterBackground}>
                {/* Subtle glow background */}
                <Animated.View
                    style={[
                        styles.meterGlow,
                        {
                            width: meterWidth,
                            backgroundColor: statusColor,
                            opacity: glowOpacity,
                        },
                    ]}
                />

                {/* Main meter fill */}
                <Animated.View
                    style={[
                        styles.meterFill,
                        {
                            width: meterWidth,
                            backgroundColor: statusColor,
                        },
                    ]}
                />
            </View>
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    meterBackground: {
        height: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
    },
    meterGlow: {
        position: 'absolute',
        height: '100%',
        borderRadius: 6,
        blur: 8,
    },
    meterFill: {
        position: 'absolute',
        height: '100%',
        borderRadius: 6,
    },
});
