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

    // Level is already on 0-10 scale from RMS audio detection
    // Convert to 0-100 scale for display
    const normalizedLevel = Math.min(Math.max(level * 10, 0), 100);

    // Smooth animation of meter fill
    useEffect(() => {
        Animated.spring(animatedLevel, {
            toValue: normalizedLevel,
            useNativeDriver: false,
            speed: 12,
            bounciness: 3,
        }).start();
    }, [normalizedLevel, animatedLevel]);

    // Return early only AFTER all hooks have been called
    if (!isRecording) {
        return null;
    }

    // Determine color based on volume level
    const getStatusColor = () => {
        if (normalizedLevel > 70) return theme.colors.error;      // Too loud
        if (normalizedLevel >= 20) return theme.colors.primary;   // Good
        return theme.colors.warning;                              // Quiet
    };

    const statusColor = getStatusColor();
    const styles = createStyles(theme);

    // Interpolate width
    const meterWidth = animatedLevel.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
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
        height: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
    },
    meterGlow: {
        position: 'absolute',
        height: '100%',
        borderRadius: 4,
        blur: 8,
    },
    meterFill: {
        position: 'absolute',
        height: '100%',
        borderRadius: 4,
    },
});
