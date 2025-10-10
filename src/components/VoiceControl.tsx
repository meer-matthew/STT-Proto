import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useConversation } from '../context/ConversationContext';

type VoiceControlsProps = {
    onStartRecording: () => void;
    onStopRecording: () => void;
};

export function VoiceControl({ onStartRecording, onStopRecording }: VoiceControlsProps) {
    const { isRecording } = useConversation();

    const handlePress = () => {
        if (isRecording) {
            onStopRecording();
        } else {
            onStartRecording();
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.micButton, isRecording && styles.micButtonActive]}
                onPress={handlePress}
                activeOpacity={0.8}>
                <Text style={styles.micIcon}>🎤</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
                {isRecording ? 'Recording...' : 'Tap to Speak'}
            </Text>
            <Text style={styles.subtitle}>
                {isRecording ? 'Tap again to stop' : 'Your voice will be converted to text'}
            </Text>

            {!isRecording && (
                <>
                    <View style={styles.volumeContainer}>
                        <Text style={styles.volumeLabel}>Volume</Text>
                        <Text style={styles.volumeIcon}>🔊</Text>
                    </View>

                    <View style={styles.waveform}>
                        <View style={[styles.bar, styles.barInactive]} />
                        <View style={[styles.bar, styles.barInactive]} />
                        <View style={[styles.bar, styles.barInactive]} />
                        <View style={[styles.bar, styles.barInactive]} />
                        <View style={[styles.bar, styles.barInactive]} />
                    </View>
                </>
            )}

            {isRecording && (
                <View style={styles.waveform}>
                    <View style={[styles.bar, styles.barInactive]} />
                    <View style={[styles.bar, styles.barActive]} />
                    <View style={[styles.bar, styles.barActive]} />
                    <View style={[styles.bar, styles.barActive]} />
                    <View style={[styles.bar, styles.barInactive]} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 24,
    },
    micButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#5a6470',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    micButtonActive: {
        backgroundColor: '#e74c3c',
    },
    micIcon: {
        fontSize: 32,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
    },
    volumeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    volumeLabel: {
        fontSize: 16,
        color: '#000',
    },
    volumeIcon: {
        fontSize: 20,
    },
    waveform: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 60,
    },
    bar: {
        width: 8,
        borderRadius: 4,
    },
    barInactive: {
        height: 20,
        backgroundColor: '#ccc',
    },
    barActive: {
        height: 40,
        backgroundColor: '#5a6470',
    },
});