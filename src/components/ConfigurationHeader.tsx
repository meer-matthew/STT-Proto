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
            <Text style={styles.title}>{configuration} Configuration</Text>
            <View style={styles.avatarsContainer}>
                <View style={styles.section}>
                    <Text style={styles.label}>Caregivers</Text>
                    <View style={styles.avatarRow}>
                        {Array.from({ length: caregiverCount }).map((_, index) => (
                            <AvatarIcon key={`caregiver-${index}`} />
                        ))}
                    </View>
                </View>
                <View style={styles.section}>
                    <Text style={styles.label}>User</Text>
                    <View style={styles.avatarRow}>
                        <AvatarIcon />
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 12,
    },
    avatarsContainer: {
        flexDirection: 'row',
        gap: 32,
    },
    section: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
    avatarRow: {
        flexDirection: 'row',
        gap: 8,
    },
});