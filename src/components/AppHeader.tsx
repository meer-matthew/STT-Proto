import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import { NotificationBell } from './NotificationBell';
import { getAvatarForUser } from '../utils/avatarUtils';

type AppHeaderProps = {
    showBorder?: boolean;
    navigation?: any;
    showAvatar?: boolean;
    showMenuButton?: boolean;
    onMenuPress?: () => void;
};

export function AppHeader({ showBorder = true, navigation, showAvatar = true, showMenuButton = false, onMenuPress }: AppHeaderProps) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const styles = createStyles(theme, showBorder, insets.top);
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
            {/* Menu Button - Left Side */}
            {showMenuButton && (
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={onMenuPress}
                    activeOpacity={0.7}>
                    <Icon name="bars" size={20} color={theme.colors.text} />
                </TouchableOpacity>
            )}

            <Text style={styles.appName}>Wakaku STT</Text>

            {/* Show notification bell if user is logged in */}
            {username && showAvatar && (
                <View style={styles.notificationContainer}>
                    <NotificationBell navigation={navigation} />
                </View>
            )}

            {/* Only show avatar if user is logged in and showAvatar prop is true */}
            {username && showAvatar && (
                <View style={styles.avatarContainer}>
                    <TouchableOpacity
                        style={styles.avatarButton}
                        onPress={() => setShowDropdown(!showDropdown)}
                        activeOpacity={0.7}>
                        <Image
                            source={getAvatarForUser(username)}
                            style={styles.avatar}
                        />
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

const createStyles = (theme: any, showBorder: boolean, topInset: number) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: topInset,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderBottomWidth: showBorder ? 1 : 0,
        borderBottomColor: theme.colors.borderLight,
        position: 'relative',
    },
    menuButton: {
        position: 'absolute',
        left: theme.spacing.lg,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xs,
        zIndex: 1002,
    },
    appName: {
        fontSize: theme.fontSize.lg,
        fontWeight: '700',
        fontFamily: theme.fonts.bold,
        color: theme.colors.primary,
    },
    notificationContainer: {
        position: 'absolute',
        right: theme.spacing.lg + 50, // Position to left of avatar
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1001,
    },
    avatarContainer: {
        position: 'absolute',
        right: theme.spacing.lg,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1001,
    },
    avatarButton: {
        padding: theme.spacing.xs,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
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
        fontFamily: theme.fonts.bold,
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
        fontFamily: theme.fonts.regular,
        color: '#666',
    },
});
