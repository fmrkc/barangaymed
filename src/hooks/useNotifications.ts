import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationsService } from '../services/notificationsService';
import { Notification } from '../types/notifications';

export const useNotifications = () => {
  const { currentUser, userRole } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [archivedNotifications, setArchivedNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivedLoading, setArchivedLoading] = useState(true);

  const notificationsService = NotificationsService.getInstance();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = notificationsService.getUserNotifications(
      currentUser.uid,
      currentUser.email || undefined,
      userRole || undefined,
      (newNotifications) => {
        setNotifications(newNotifications);
        if (loading) {
            setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser, userRole]);

  useEffect(() => {
    if (!currentUser) {
      setArchivedLoading(false);
      return;
    }

    setArchivedLoading(true);
    const fetchArchived = async () => {
      try {
        const fetchedArchived = await notificationsService.getArchivedNotifications(currentUser.uid);
        setArchivedNotifications(fetchedArchived);
      } catch (err) {
        console.error('Failed to fetch archived notifications:', err);
      } finally {
        setArchivedLoading(false);
      }
    };

    fetchArchived();
  }, [currentUser, notificationsService]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!currentUser) return;
    try {
      await notificationsService.markAsRead(notificationId, currentUser.uid);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [currentUser, notificationsService]);

  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;
    try {
      await notificationsService.markAllAsRead(currentUser.uid);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [currentUser, notificationsService]);

  const archiveNotification = useCallback(async (notificationId: string) => {
    if (!currentUser) return;
    try {
      await notificationsService.archiveNotification(notificationId, currentUser.uid);
      // Optimistically update the UI
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const archived = notifications.find(n => n.id === notificationId);
      if (archived) {
        setArchivedNotifications(prev => [...prev, { ...archived, isShown: false }].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
      }
    } catch (err) {
      console.error('Failed to archive notification:', err);
    }
  }, [currentUser, notificationsService, notifications]);

  return { notifications, loading, markAsRead, markAllAsRead, archivedNotifications, archivedLoading, archiveNotification };
};