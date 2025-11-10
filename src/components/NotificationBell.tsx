import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, RefreshControl } from 'react-native';
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
    const [showModal, setShowModal] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch unread count on mount and every 30 seconds
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
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
        setShowModal(true);
        await fetchNotifications();
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
                    setShowModal(false);
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
        <>
            <TouchableOpacity
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

            <Modal
                visible={showModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Notifications</Text>
                            <View style={styles.modalActions}>
                                {unreadCount > 0 && (
                                    <TouchableOpacity
                                        onPress={handleMarkAllRead}
                                        style={styles.markAllButton}
                                        activeOpacity={0.7}>
                                        <Text style={styles.markAllText}>Mark all read</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={() => setShowModal(false)}
                                    style={styles.closeButton}
                                    activeOpacity={0.7}>
                                    <Icon name="times" size={24} color={theme.colors.text} />
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
                                    <Icon name="bell-slash" size={48} color={theme.colors.borderLight} />
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
                                                size={20}
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
                </View>
            </Modal>
        </>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderTopRightRadius: theme.borderRadius.lg,
        maxHeight: '80%',
        minHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    modalTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: '700',
        color: theme.colors.text,
    },
    modalActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    markAllButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    markAllText: {
        color: theme.colors.primary,
        fontSize: theme.fontSize.sm,
        fontWeight: '600',
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    notificationList: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
        paddingTop: 100,
    },
    emptyText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.md,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        backgroundColor: theme.colors.white,
    },
    notificationUnread: {
        backgroundColor: '#f0f8ff',
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    notificationMessage: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    notificationTime: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
        marginLeft: theme.spacing.sm,
    },
});
