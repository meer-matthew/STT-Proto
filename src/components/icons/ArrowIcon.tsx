import React from 'react';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

export function ArrowIcon() {
    return <Icon name="arrow-right" size={16} color="#fff" style={styles.arrowIcon} />;
}

const styles = StyleSheet.create({
    arrowIcon: {
        marginLeft: 4,
    },
});