import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useConversation } from '../context/ConversationContext';

export function InputModeToggle() {
    const { inputMode, setInputMode } = useConversation();

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.button,
                    inputMode === 'speech' && styles.activeButton,
                ]}
                onPress={() => setInputMode('speech')}
                activeOpacity={0.7}>
                <Text style={[
                    styles.buttonText,
                    inputMode === 'speech' && styles.activeButtonText,
                ]}>
                    🎤 Speech
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.button,
                    inputMode === 'keyboard' && styles.activeButton,
                ]}
                onPress={() => setInputMode('keyboard')}
                activeOpacity={0.7}>
                <Text style={[
                    styles.buttonText,
                    inputMode === 'keyboard' && styles.activeButtonText,
                ]}>
                    ⌨️ Keyboard
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
        gap: 4,
    },
    button: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
    },
    activeButton: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeButtonText: {
        color: '#000',
        fontWeight: '600',
    },
});