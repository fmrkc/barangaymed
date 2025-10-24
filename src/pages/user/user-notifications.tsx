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
  IonButton,
  IonButtons,
} from '@ionic/react';
import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { checkmarkCircle, alertCircle, mailOutline, mailOpenOutline } from 'ionicons/icons';
import { formatDistanceToNow } from 'date-fns';

const Notifications: React.FC = () => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRefresh = (event: CustomEvent) => {
    // The hook handles refreshing, but we can provide a way for the user to manually trigger.
    // In this case, the listener is already active. We just need to complete the animation.
    setTimeout(() => {
      event.detail.complete();
    }, 500);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'status_change':
      case 'registration_approved':
        return checkmarkCircle;
      case 'admin_note':
      case 'new_announcement':
        return mailOutline;
      case 'welcome':
      case 'registration':
      case 'registration_rejected':
        return alertCircle;
      default:
        return alertCircle;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'status_change':
      case 'registration_approved':
        return 'success';
      case 'admin_note':
      case 'new_announcement':
        return 'primary';
      case 'welcome':
      case 'registration':
        return 'tertiary';
      case 'registration_rejected':
        return 'danger';
      default:
        return 'warning';
    }
  };

  const formatTimestamp = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>Notifications</IonTitle>
          <IonButtons slot="end">
            {unreadCount > 0 && (
              <IonButton onClick={() => markAllAsRead()} fill="clear">
                <IonIcon slot="icon-only" icon={mailOpenOutline} />
              </IonButton>
            )}
            {unreadCount > 0 && (
              <IonBadge color="danger" style={{ marginRight: '10px' }}>
                {unreadCount}
              </IonBadge>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonLoading isOpen={loading} message="Loading notifications..." />

        {notifications.length === 0 && !loading && (
          <div className="ion-padding ion-text-center">
            <IonIcon icon={mailOutline} size="large" color="medium" />
            <h2>No Notifications</h2>
            <p>You don't have any notifications yet.</p>
          </div>
        )}

        <IonList>
          {notifications.map((notification) => (
            <IonItem
              key={notification.id}
              button
              detail={false}
              onClick={() => !notification.read && markAsRead(notification.id)}
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
                  <small>{formatTimestamp(notification.timestamp)}</small>
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

      <style>
        {`
          .unread-notification {
            background-color: rgba(var(--ion-color-primary-rgb), 0.08);
            border-left: 4px solid var(--ion-color-primary);
          }
        `}
      </style>
    </>
  );
};

export default Notifications;