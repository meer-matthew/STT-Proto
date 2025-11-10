import React from 'react';
import { View, StyleSheet } from 'react-native';
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
    // Level is on 0-10 scale from audio detection with logarithmic scaling
    const normalizedLevel = Math.min(Math.max(level * 10, 0), 100);

    // Determine volume status and color with adjusted thresholds
    // Since we use logarithmic scaling, the thresholds are lower
    const getColor = () => {
        if (normalizedLevel > 70) return theme.colors.error;      // Too loud (>7 on 0-10 scale)
        if (normalizedLevel >= 20) return theme.colors.primary;   // Good volume (2-7 on 0-10 scale)
        return theme.colors.warning;                              // Too quiet (<2 on 0-10 scale)
    };

    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            {/* Minimal visual meter only */}
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
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    meterBackground: {
        height: 6,
        backgroundColor: theme.colors.borderLight,
        borderRadius: 3,
        overflow: 'hidden',
    },
    meterFill: {
        height: '100%',
        borderRadius: 3,
    },
});
