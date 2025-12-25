/**
 * useNotifications Hook
 * Provides notification state and actions for components
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  Notification,
} from '@/lib/notifications/notification-service';

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotifications(options?: {
  limit?: number;
  refreshInterval?: number;
}): UseNotificationsReturn {
  const { limit = 20, refreshInterval = 30000 } = options || {};

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [notifs, count] = await Promise.all([
        fetchNotifications({ limit }),
        fetchUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadNotifications();

    // Set up refresh interval
    const interval = setInterval(loadNotifications, refreshInterval);

    // Subscribe to realtime notifications
    const unsubscribe = subscribeToNotifications((newNotif) => {
      setNotifications(prev => [newNotif, ...prev.slice(0, limit - 1)]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [loadNotifications, refreshInterval, limit]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    const success = await markAsRead(id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    const success = await markAllAsRead();
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: loadNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
  };
}
