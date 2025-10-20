import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';

type AppHeaderProps = {
    showBorder?: boolean;
    navigation?: any;
    showAvatar?: boolean;
};

export function AppHeader({ showBorder = true, navigation, showAvatar = true }: AppHeaderProps) {
    const theme = useTheme();
    const styles = createStyles(theme, showBorder);
    const [showDropdown, setShowDropdown] = useState(false);
    const [username, setUsername] = useState<string | null>(null);

    // Check if user is logged in
    useEffect(() => {
        const checkUser = async () => {
            try {
                const user = await authService.getUser();
                setUsername(user?.username || null);
            } catch (error) {
                console.error('Error getting user:', error);
                setUsername(null);
            }
        };

        checkUser().catch(console.error);
    }, []);

    const handleLogout = async () => {
        try {
            await authService.logout();
            setUsername(null);
            setShowDropdown(false);

            // Navigate to welcome screen if navigation is available
            if (navigation) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Welcome' }],
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.appName}>Wakaku STT</Text>

            {/* Only show avatar if user is logged in and showAvatar prop is true */}
            {username && showAvatar && (
                <View style={styles.avatarContainer}>
                    <TouchableOpacity
                        style={styles.avatarButton}
                        onPress={() => setShowDropdown(!showDropdown)}
                        activeOpacity={0.7}>
                        <View style={styles.avatar}>
                            <Icon name="user" size={18} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {showDropdown && (
                        <View style={styles.dropdown}>
                            <View style={styles.dropdownHeader}>
                                <Text style={styles.dropdownUsername}>{username}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={handleLogout}
                                activeOpacity={0.7}>
                                <Icon name="sign-out" size={16} color="#666" />
                                <Text style={styles.dropdownItemText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const createStyles = (theme: any, showBorder: boolean) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderBottomWidth: showBorder ? 1 : 0,
        borderBottomColor: theme.colors.borderLight,
        position: 'relative',
    },
    appName: {
        fontSize: theme.fontSize.lg,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    avatarContainer: {
        position: 'absolute',
        right: theme.spacing.lg,
        top: '50%',
        transform: [{ translateY: -18 }], // Half of avatar height to center
        zIndex: 1001,
    },
    avatarButton: {
        padding: theme.spacing.xs,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdown: {
        position: 'absolute',
        top: 50,
        right: 0,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        minWidth: 180,
        zIndex: 1000,
    },
    dropdownHeader: {
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    dropdownUsername: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
        color: theme.colors.text,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
    },
    dropdownItemText: {
        fontSize: theme.fontSize.md,
        color: '#666',
    },
});
