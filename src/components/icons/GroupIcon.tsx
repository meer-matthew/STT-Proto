import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export function GroupIcon() {
    return (
        <View style={styles.groupIconContainer}>
            <View style={styles.groupIconCircle}>
                <Icon name="users" size={36} color="#fff" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    groupIconContainer: {
        marginBottom: 24,
    },
    groupIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#5a6470',
        justifyContent: 'center',
        alignItems: 'center',
    },
});