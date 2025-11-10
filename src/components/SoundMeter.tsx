import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type SoundMeterProps = {
    level: number; // 0-10 scale
    isRecording: boolean;
};

export function SoundMeter({ level, isRecording }: SoundMeterProps) {
    const theme = useTheme();
    const animatedLevel = useRef(new Animated.Value(0)).current;
    const peakLevelRef = useRef(0);

    // Level is already on 0-10 scale from RMS audio detection
    // Convert to 0-100 scale for display
    const normalizedLevel = Math.min(Math.max(level * 10, 0), 100);

    // Track peak level for visual indicator
    if (normalizedLevel > peakLevelRef.current) {
        peakLevelRef.current = normalizedLevel;
    }

    // Smooth animation of meter fill
    useEffect(() => {
        Animated.spring(animatedLevel, {
            toValue: normalizedLevel,
            useNativeDriver: false,
            speed: 15,
            bounciness: 2,
        }).start();
    }, [normalizedLevel, animatedLevel]);

    // Reset peak level periodically (every 2 seconds without updates)
    useEffect(() => {
        const resetTimer = setTimeout(() => {
            peakLevelRef.current = normalizedLevel;
        }, 2000);

        return () => clearTimeout(resetTimer);
    }, [normalizedLevel]);

    // Return early only AFTER all hooks have been called
    if (!isRecording) {
        return null;
    }

    // Determine volume status and color with expanded zones for better feedback
    const getVolumeStatus = () => {
        if (normalizedLevel > 80) return { color: theme.colors.error, label: 'TOO LOUD' };
        if (normalizedLevel > 70) return { color: theme.colors.error, label: 'LOUD' };
        if (normalizedLevel > 50) return { color: theme.colors.primary, label: 'GOOD' };
        if (normalizedLevel > 20) return { color: theme.colors.primary, label: 'GOOD' };
        if (normalizedLevel > 10) return { color: theme.colors.warning, label: 'QUIET' };
        return { color: theme.colors.warning, label: 'VERY QUIET' };
    };

    const volumeStatus = getVolumeStatus();
    const styles = createStyles(theme);

    // Interpolate width and shadow based on level
    const meterWidth = animatedLevel.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    const shadowOpacity = animatedLevel.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 0.3],
    });

    return (
        <View style={styles.container}>
            {/* Volume status label */}
            <View style={styles.headerRow}>
                <Text style={styles.label}>Microphone Level</Text>
                <View style={[styles.statusBadge, { backgroundColor: volumeStatus.color + '20' }]}>
                    <Text style={[styles.statusLabel, { color: volumeStatus.color }]}>
                        {volumeStatus.label}
                    </Text>
                </View>
            </View>

            {/* Main meter with multiple visual layers */}
            <View style={styles.meterContainer}>
                {/* Background track */}
                <View style={styles.meterBackground}>
                    {/* Threshold markers for reference */}
                    <View style={styles.thresholdMarker} />
                    <View style={styles.thresholdMarker} />
                    <View style={styles.thresholdMarker} />

                    {/* Animated fill with glow effect */}
                    <Animated.View
                        style={[
                            styles.meterFill,
                            {
                                width: meterWidth,
                                backgroundColor: volumeStatus.color,
                                shadowOpacity: shadowOpacity,
                            },
                        ]}
                    />

                    {/* Peak indicator line */}
                    <View
                        style={[
                            styles.peakIndicator,
                            {
                                left: `${Math.min(peakLevelRef.current, 100)}%`,
                            },
                        ]}
                    />
                </View>

                {/* Numeric display */}
                <Text style={[styles.levelText, { color: volumeStatus.color }]}>
                    {Math.round(normalizedLevel)}%
                </Text>
            </View>

            {/* Visual zones guide */}
            <View style={styles.zonesGuide}>
                <View style={[styles.zoneIndicator, { backgroundColor: theme.colors.warning }]} />
                <Text style={styles.zoneText}>Quiet</Text>

                <View style={[styles.zoneIndicator, { backgroundColor: theme.colors.primary }]} />
                <Text style={styles.zoneText}>Good</Text>

                <View style={[styles.zoneIndicator, { backgroundColor: theme.colors.error }]} />
                <Text style={styles.zoneText}>Loud</Text>
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
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    label: {
        fontSize: theme.fontSize.sm,
        fontWeight: '600',
        color: theme.colors.text,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusLabel: {
        fontSize: theme.fontSize.xs,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    meterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    meterBackground: {
        flex: 1,
        height: 12,
        backgroundColor: theme.colors.borderLight,
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    meterFill: {
        height: '100%',
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    thresholdMarker: {
        position: 'absolute',
        width: 1,
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        top: 0,
    },
    peakIndicator: {
        position: 'absolute',
        width: 2,
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        top: 0,
    },
    levelText: {
        minWidth: 40,
        textAlign: 'right',
        fontSize: theme.fontSize.sm,
        fontWeight: '700',
    },
    zonesGuide: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.md,
        marginTop: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },
    zoneIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    zoneText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
});
