import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../context/ThemeContext';
import { notificationService, Notification } from '../services/notificationService';
import { authService } from '../services/authService';

type NotificationBellProps = {
    navigation?: any;
};

export function NotificationBell({ navigation }: NotificationBellProps) {
    const theme = useTheme();
    const styles = createStyles(theme);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const bellRef = useRef<View>(null);

    // Fetch unread count on mount and every 30 seconds
    // Only fetch if user is authenticated (i.e., this component is rendered)
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        const initNotifications = async () => {
            try {
                const token = await authService.getToken();
                // Only fetch if token exists
                if (token) {
                    await fetchUnreadCount();
                    // Set up interval to poll every 30 seconds
                    interval = setInterval(fetchUnreadCount, 30000);
                }
            } catch (error) {
                // Silently fail - if there's an error, user isn't authenticated
                console.log('[NotificationBell] Skipping notification fetch - user not authenticated');
            }
        };

        initNotifications();

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await notificationService.getNotifications(false, 20);
            setNotifications(response.notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleBellPress = async () => {
        setShowDropdown(!showDropdown);
        if (!showDropdown) {
            await fetchNotifications();
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        await fetchUnreadCount();
        setRefreshing(false);
    };

    const handleNotificationPress = async (notification: Notification) => {
        // Mark as read if not already
        if (!notification.is_read) {
            try {
                await notificationService.markAsRead(notification.id);
                await fetchUnreadCount();
                await fetchNotifications();
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }

        // Navigate to conversation if it has one
        if (notification.conversation_id && navigation) {
            try {
                // Get current user to pass username
                const user = await authService.getUser();
                if (user) {
                    setShowDropdown(false);
                    navigation.navigate('Conversation', {
                        username: user.username,
                        conversationId: notification.conversation_id
                    });
                }
            } catch (error) {
                console.error('Error navigating to conversation:', error);
            }
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            await fetchUnreadCount();
            await fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                ref={bellRef}
                style={styles.bellContainer}
                onPress={handleBellPress}
                activeOpacity={0.7}>
                <Icon name="bell" size={20} color={theme.colors.text} />
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {showDropdown && (
                <>
                    {/* Overlay to close dropdown when tapping outside */}
                    <Pressable
                        style={styles.dropdownOverlay}
                        onPress={() => setShowDropdown(false)}
                    />

                    {/* Dropdown Panel */}
                    <View style={styles.dropdownPanel}>
                        <View style={styles.dropdownHeader}>
                            <Text style={styles.dropdownTitle}>Notifications</Text>
                            <View style={styles.dropdownActions}>
                                {unreadCount > 0 && (
                                    <TouchableOpacity
                                        onPress={handleMarkAllRead}
                                        style={styles.markAllButton}
                                        activeOpacity={0.7}>
                                        <Text style={styles.markAllText}>Mark all read</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={() => setShowDropdown(false)}
                                    style={styles.closeButton}
                                    activeOpacity={0.7}>
                                    <Icon name="times" size={18} color={theme.colors.text} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView
                            style={styles.notificationList}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                            }>
                            {notifications.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Icon name="bell-slash" size={32} color={theme.colors.borderLight} />
                                    <Text style={styles.emptyText}>No notifications</Text>
                                </View>
                            ) : (
                                notifications.map((notification) => (
                                    <TouchableOpacity
                                        key={notification.id}
                                        style={[
                                            styles.notificationItem,
                                            !notification.is_read && styles.notificationUnread,
                                        ]}
                                        onPress={() => handleNotificationPress(notification)}
                                        activeOpacity={0.7}>
                                        <View style={styles.notificationIcon}>
                                            <Icon
                                                name={notification.type === 'conversation_added' ? 'users' : 'bell'}
                                                size={18}
                                                color={theme.colors.primary}
                                            />
                                        </View>
                                        <View style={styles.notificationContent}>
                                            <Text style={styles.notificationTitle}>
                                                {notification.title}
                                            </Text>
                                            <Text style={styles.notificationMessage}>
                                                {notification.message}
                                            </Text>
                                            <Text style={styles.notificationTime}>
                                                {formatTimeAgo(notification.created_at)}
                                            </Text>
                                        </View>
                                        {!notification.is_read && (
                                            <View style={styles.unreadDot} />
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </>
            )}
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        position: 'relative',
    },
    bellContainer: {
        padding: theme.spacing.sm,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: theme.colors.error,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: theme.colors.white,
        fontSize: 10,
        fontWeight: '700',
    },
    dropdownOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    dropdownPanel: {
        position: 'absolute',
        top: 50,
        right: 0,
        width: 360,
        maxHeight: 500,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        zIndex: 1,
        overflow: 'hidden',
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        backgroundColor: theme.colors.white,
    },
    dropdownTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: '700',
        color: theme.colors.text,
    },
    dropdownActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    markAllButton: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
    },
    markAllText: {
        color: theme.colors.primary,
        fontSize: 11,
        fontWeight: '600',
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    notificationList: {
        maxHeight: 400,
    },
    emptyState: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
        paddingVertical: theme.spacing.xl,
    },
    emptyText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.md,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        backgroundColor: theme.colors.white,
    },
    notificationUnread: {
        backgroundColor: '#f0f8ff',
    },
    notificationIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
        flexShrink: 0,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: theme.fontSize.sm,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 2,
    },
    notificationMessage: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        marginBottom: 2,
        lineHeight: 14,
    },
    notificationTime: {
        fontSize: 10,
        color: theme.colors.textSecondary,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        marginLeft: theme.spacing.sm,
        flexShrink: 0,
    },
});
