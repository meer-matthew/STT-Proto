import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AvatarIcon } from './icons/AvatarIcon';

type ConfigurationHeaderProps = {
    configuration: string;
    caregiverCount: number;
};

export function ConfigurationHeader({ configuration, caregiverCount }: ConfigurationHeaderProps) {
    return (
        <View style={styles.container}>
            <View style={styles.headerLeft}>
                <AvatarIcon variant="large" />
                <View style={styles.userInfo}>
                    <Text style={styles.title}>Meeting Setup</Text>
                    <Text style={styles.subtitle}>{configuration} Configuration</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    userInfo: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400',
        color: '#666',
    },
});
