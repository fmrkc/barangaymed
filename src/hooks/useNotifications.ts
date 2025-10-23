import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationsService } from '../services/notificationsService';
import { Notification } from '../types/notifications';

export const useNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const notificationsService = NotificationsService.getInstance();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = notificationsService.getUserNotifications(
      currentUser.uid,
      (newNotifications) => {
        setNotifications(newNotifications);
        if (loading) {
            setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser, loading]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!currentUser) return;
    try {
      await notificationsService.markAsRead(notificationId, currentUser.uid);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Optionally, you can expose an error state to the component
    }
  }, [currentUser, notificationsService]);

  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;
    try {
      await notificationsService.markAllAsRead(currentUser.uid);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      // Optionally, you can expose an error state to the component
    }
  }, [currentUser, notificationsService]);

  return { notifications, loading, markAsRead, markAllAsRead };
};
