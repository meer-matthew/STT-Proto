import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

type AvatarIconProps = {
    variant?: 'default' | 'small';
};

export function AvatarIcon({ variant = 'default' }: AvatarIconProps) {
    const size = variant === 'small' ? 40 : 48;
    const iconSize = variant === 'small' ? 20 : 24;

    return (
        <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}>
            <Icon name="user" size={iconSize} color="#fff" />
        </View>
    );
}

const styles = StyleSheet.create({
    avatarCircle: {
        backgroundColor: '#5a6470',
        justifyContent: 'center',
        alignItems: 'center',
    },
});