import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

type SoundMeterProps = {
    level: number; // 0-10 scale
    isRecording: boolean;
};

export function SoundMeter({ level, isRecording }: SoundMeterProps) {
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
        if (isTooLoud) return '#e74c3c'; // Red
        if (isGood) return '#27ae60'; // Green
        return '#f39c12'; // Orange (too quiet)
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Icon name={getIcon()} size={20} color={getColor()} />
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
                    let barColor = '#e0e0e0';

                    if (isActive) {
                        if (index >= 8) barColor = '#e74c3c'; // Red bars
                        else if (index >= 3) barColor = '#27ae60'; // Green bars
                        else barColor = '#f39c12'; // Orange bars
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
                    <Icon name="exclamation-triangle" size={14} color="#e74c3c" />
                    <Text style={styles.warningText}>
                        Please lower your voice to avoid distortion
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
    },
    meterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    meterBackground: {
        flex: 1,
        height: 24,
        backgroundColor: '#e0e0e0',
        borderRadius: 12,
        overflow: 'hidden',
    },
    meterFill: {
        height: '100%',
        borderRadius: 12,
        transition: 'width 0.2s ease',
    },
    levelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        minWidth: 45,
        textAlign: 'right',
    },
    barsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
        marginBottom: 8,
    },
    bar: {
        flex: 1,
        height: 32,
        borderRadius: 4,
        backgroundColor: '#e0e0e0',
    },
    barActive: {
        opacity: 1,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fee',
        padding: 8,
        borderRadius: 8,
        marginTop: 8,
    },
    warningText: {
        flex: 1,
        fontSize: 12,
        color: '#e74c3c',
        lineHeight: 16,
    },
});
