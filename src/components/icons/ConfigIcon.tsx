import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

type ConfigIconProps = {
    type: '1:1' | '2:1' | '3:1' | '1:2' | '2:2';
};

export function ConfigIcon({ type }: ConfigIconProps) {
    const getIconName = () => {
        switch (type) {
            case '1:1':
                return 'user';
            case '2:1':
            case '1:2':
                return 'users';
            case '3:1':
            case '2:2':
                return 'users';
            default:
                return 'user';
        }
    };

    return (
        <View style={styles.iconCircle}>
            <Icon name={getIconName()} size={20} color="#fff" />
        </View>
    );
}

const styles = StyleSheet.create({
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#5a6470',
        justifyContent: 'center',
        alignItems: 'center',
    },
});