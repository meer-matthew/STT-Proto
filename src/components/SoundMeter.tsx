import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';

type SoundMeterProps = {
    level: number; // 0-10 scale
    isRecording: boolean;
};

export function SoundMeter({ level, isRecording }: SoundMeterProps) {
    const theme = useTheme();

    if (!isRecording) {
        return null;
    }

    // Normalize level to 0-100 scale
    const normalizedLevel = Math.min(Math.max(level * 10, 0), 100);

    // Determine volume status
    const isTooLoud = normalizedLevel > 80;
    const isGood = normalizedLevel >= 30 && normalizedLevel <= 80;
    const isTooQuiet = normalizedLevel < 30;

    // Get color based on level
    const getColor = () => {
        if (isTooLoud) return theme.colors.error;
        if (isGood) return theme.colors.primary;
        return theme.colors.warning;
    };

    // Get status text
    const getStatusText = () => {
        if (isTooLoud) return 'Too Loud!';
        if (isTooQuiet) return 'Speak Louder';
        return 'Good Volume';
    };

    // Get icon
    const getIcon = () => {
        if (isTooLoud) return 'volume-up';
        if (isTooQuiet) return 'volume-down';
        return 'volume-up';
    };

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Icon name={getIcon()} size={28} color={getColor()} />
                <Text style={[styles.statusText, { color: getColor() }]}>
                    {getStatusText()}
                </Text>
            </View>

            {/* Visual meter */}
            <View style={styles.meterContainer}>
                <View style={styles.meterBackground}>
                    <View
                        style={[
                            styles.meterFill,
                            {
                                width: `${normalizedLevel}%`,
                                backgroundColor: getColor(),
                            },
                        ]}
                    />
                </View>
                <Text style={styles.levelText}>{Math.round(normalizedLevel)}%</Text>
            </View>

            {/* Level bars visualization */}
            <View style={styles.barsContainer}>
                {[...Array(10)].map((_, index) => {
                    const isActive = index < Math.floor(normalizedLevel / 10);
                    let barColor = theme.colors.borderLight;

                    if (isActive) {
                        if (index >= 8) barColor = theme.colors.error;
                        else if (index >= 3) barColor = theme.colors.primary;
                        else barColor = theme.colors.warning;
                    }

                    return (
                        <View
                            key={index}
                            style={[
                                styles.bar,
                                { backgroundColor: barColor },
                                isActive && styles.barActive,
                            ]}
                        />
                    );
                })}
            </View>

            {/* Warning message for too loud */}
            {isTooLoud && (
                <View style={styles.warningContainer}>
                    <Icon name="exclamation-triangle" size={24} color={theme.colors.error} />
                    <Text style={styles.warningText}>
                        Please lower your voice to avoid distortion
                    </Text>
                </View>
            )}
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        borderWidth: theme.borderWidth.thick,
        borderColor: theme.colors.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    statusText: {
        fontSize: 22,
        fontWeight: '700',
    },
    meterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    meterBackground: {
        flex: 1,
        height: 36,
        backgroundColor: theme.colors.borderLight,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: theme.borderWidth.medium,
        borderColor: '#c0c0c0',
    },
    meterFill: {
        height: '100%',
        borderRadius: 18,
        transition: 'width 0.2s ease',
    },
    levelText: {
        fontSize: theme.fontSize.xl,
        fontWeight: '700',
        color: theme.colors.text,
        minWidth: 60,
        textAlign: 'right',
    },
    barsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 6,
        marginBottom: theme.spacing.sm,
    },
    bar: {
        flex: 1,
        height: 48,
        borderRadius: 6,
        backgroundColor: theme.colors.borderLight,
        borderWidth: theme.borderWidth.medium,
        borderColor: '#c0c0c0',
    },
    barActive: {
        opacity: 1,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.errorLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginTop: theme.spacing.sm,
        borderWidth: theme.borderWidth.medium,
        borderColor: '#ff9999',
    },
    warningText: {
        flex: 1,
        fontSize: theme.fontSize.lg,
        fontWeight: '700',
        color: '#c0392b',
        lineHeight: 24,
    },
});
