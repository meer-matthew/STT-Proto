import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

type SpeakingIndicatorProps = {
    text: string;
    onCancel?: () => void;
};

export function SpeechIndicator({ text, onCancel }: SpeakingIndicatorProps) {
    return (
        <View style={styles.container}>
            <View style={styles.bubble}>
                <View style={styles.header}>
                    <View style={styles.dots}>
                        <View style={[styles.dot, styles.dotInactive]} />
                        <View style={[styles.dot, styles.dotActive]} />
                        <View style={[styles.dot, styles.dotActive]} />
                    </View>
                    <Text style={styles.statusText}>Speaking Now...</Text>
                    {onCancel && (
                        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                            <Icon name="times" size={14} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.text}>{text}</Text>
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    bubble: {
        backgroundColor: '#f0f8ff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#5a6470',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    dots: {
        flexDirection: 'row',
        gap: 4,
    },
    dot: {
        width: 8,
        height: 24,
        borderRadius: 4,
    },
    dotInactive: {
        backgroundColor: '#ccc',
    },
    dotActive: {
        backgroundColor: '#5a6470',
    },
    statusText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    cancelButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#5a6470',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 15,
        color: '#000',
        lineHeight: 20,
    },
});