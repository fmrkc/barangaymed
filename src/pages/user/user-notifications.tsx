import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonIcon,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonLoading,
  IonToast,
  IonButton,
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationsService } from '../../services/notificationsService';
import { Notification } from '../../types/notifications';
import { checkmarkCircle, alertCircle, mailOutline } from 'ionicons/icons';
import { format } from 'date-fns';

const Notifications: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);


  const notificationsService = NotificationsService.getInstance();

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      const unsubscribe = setupRealtimeListener();
      return () => unsubscribe && unsubscribe();
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const userNotifications = await notificationsService.getUserNotificationsOnce(currentUser.uid);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setToastMessage('Error loading notifications');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListener = () => {
    if (!currentUser) return;
    return notificationsService.getUserNotifications(
      currentUser.uid,
      (newNotifications) => {
        setNotifications(newNotifications);
        setUnreadCount(newNotifications.filter(n => !n.read).length);
      }

    );
  };

  const handleRefresh = async (event: CustomEvent) => {
    if (!currentUser) {
      event.detail.complete();
      return;
    }

    try {
      const userNotifications = await notificationsService.getUserNotificationsOnce(currentUser.uid);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      event.detail.complete();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return checkmarkCircle;
      case 'admin_note':
        return mailOutline;
      default:
        return alertCircle;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'status_change':
        return 'success';
      case 'admin_note':
        return 'primary';
      default:
        return 'warning';
    }
  };

  const formatDateTime = (date: Date) => {
    return format(date, 'MMM dd, yyyy • h:mm a');
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Notifications</IonTitle>
          {unreadCount > 0 && (
            <IonBadge slot="end" color="danger">
              {unreadCount}
            </IonBadge>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonLoading isOpen={loading} message="Loading notifications..." />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />

        {notifications.length === 0 && !loading && (
          <div className="ion-padding ion-text-center">
            {/* ✅ FIXED: Replace IonEmptyState with Ionic layout */}
            <IonIcon icon={mailOutline} size="large" color="medium" />
            <h2>No Notifications</h2>
            <p>You don't have any notifications yet.</p>
            <IonButton onClick={loadNotifications} fill="clear">
              Refresh
            </IonButton>
          </div>
        )}

        <IonList>
          {notifications.map((notification) => (
            <IonItem
              key={notification.id}
              button
              detail={false}
              onClick={() => markAsRead(notification.id)}
              className={!notification.read ? 'unread-notification' : ''}
            >
              <IonIcon
                slot="start"
                icon={getNotificationIcon(notification.type)}
                color={getNotificationColor(notification.type)}
                size="large"
              />

              <IonLabel>
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <IonText color="medium">
                  <small>{notificationsService.formatNotificationTime(notification.timestamp)}</small>
                </IonText>

                {!notification.read && (
                  <IonBadge color="primary" slot="end">
                    New
                  </IonBadge>
                )}
              </IonLabel>
            </IonItem>
          ))}
        </IonList>

        {notifications.length > 0 && (
          <div className="ion-padding ion-text-center">
            <IonText color="medium">
              <small>
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </small>
            </IonText>
          </div>
        )}
      </IonContent>

      {/* ✅ FIXED: Use standard style tag */}
      <style>
        {`
          .unread-notification {
            background-color: rgba(var(--ion-color-primary-rgb), 0.1);
            border-left: 4px solid var(--ion-color-primary);
          }
        `}
      </style>
    </>
  );
};

export default Notifications;