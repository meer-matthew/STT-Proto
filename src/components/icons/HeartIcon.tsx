import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export function HeartIcon() {
    return (
        <View style={styles.roleIconCircle}>
            <Icon name="heart" size={24} color="#5a6470" />
        </View>
    );
}

const styles = StyleSheet.create({
    roleIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
});