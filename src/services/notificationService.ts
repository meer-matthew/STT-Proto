import { API_CONFIG } from '../config/api.config';
import { authService } from './authService';

const API_URL = `${API_CONFIG.BASE_URL}/api/notifications`;

export interface Notification {
    id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    conversation_id?: number;
    is_read: boolean;
    created_at: string;
    read_at?: string;
}

export interface NotificationResponse {
    notifications: Notification[];
    total: number;
}

export interface UnreadCountResponse {
    unread_count: number;
}

class NotificationService {
    /**
     * Get all notifications for the current user
     */
    async getNotifications(unreadOnly: boolean = false, limit?: number): Promise<NotificationResponse> {
        try {
            const token = await authService.getToken();
            if (!token) {
                // Return empty notifications if not authenticated instead of throwing
                return { notifications: [], total: 0 };
            }

            const params = new URLSearchParams();
            if (unreadOnly) {
                params.append('unread_only', 'true');
            }
            if (limit) {
                params.append('limit', String(limit));
            }

            const url = `${API_URL}?${params.toString()}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch notifications');
            }

            return data;
        } catch (error) {
            console.error('Get notifications error:', error);
            throw error;
        }
    }

    /**
     * Get count of unread notifications
     */
    async getUnreadCount(): Promise<number> {
        try {
            const token = await authService.getToken();
            if (!token) {
                // Return 0 if not authenticated instead of throwing
                return 0;
            }

            const response = await fetch(`${API_URL}/unread-count`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data: UnreadCountResponse = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch unread count');
            }

            return data.unread_count;
        } catch (error) {
            console.error('Get unread count error:', error);
            throw error;
        }
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId: number): Promise<Notification> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_URL}/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to mark notification as read');
            }

            return data;
        } catch (error) {
            console.error('Mark as read error:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<{ message: string; count: number }> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_URL}/read-all`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to mark all notifications as read');
            }

            return data;
        } catch (error) {
            console.error('Mark all as read error:', error);
            throw error;
        }
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId: number): Promise<void> {
        try {
            const token = await authService.getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_URL}/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete notification');
            }
        } catch (error) {
            console.error('Delete notification error:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const notificationService = new NotificationService();
