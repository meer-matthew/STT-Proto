import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

type AvatarIconProps = {
    variant?: 'default' | 'small';
};

export function UserIcon({ variant = 'default' }: AvatarIconProps) {
    const size = variant === 'small' ? 40 : 80;
    const iconSize = variant === 'small' ? 20 : 32;

    return (
        <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2 }]}>
            <Icon name="user" size={iconSize} color="#fff" />
        </View>
    );
}

const styles = StyleSheet.create({
    iconCircle: {
        backgroundColor: '#5a6470',
        justifyContent: 'center',
        alignItems: 'center',
    },
});