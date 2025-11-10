import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { AppHeader } from './AppHeader';
import { useTheme } from '../context/ThemeContext';

type AppLayoutProps = {
    children: React.ReactNode;
    showHeader?: boolean;
    showHeaderBorder?: boolean;
    navigation?: any;
    showAvatar?: boolean;
    showMenuButton?: boolean;
    onMenuPress?: () => void;
};

export function AppLayout({ children, showHeader = true, showHeaderBorder = false, navigation, showAvatar = true, showMenuButton = false, onMenuPress }: AppLayoutProps) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
            {showHeader && <AppHeader showBorder={showHeaderBorder} navigation={navigation} showAvatar={showAvatar} showMenuButton={showMenuButton} onMenuPress={onMenuPress} />}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
