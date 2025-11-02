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
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonModal,
  IonAlert,
  IonLoading,
  IonSkeletonText,
} from '@ionic/react';
import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext'; // Added import
import { checkmarkCircle, alertCircle, mailOutline, mailOpenOutline, mailOpen, mail, archiveOutline, folderOpenOutline, closeOutline, callOutline, lockClosed, sparkles, documentTextOutline } from 'ionicons/icons';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '../../types/notifications';

const Notifications: React.FC = () => {
  const { notifications, loading, markAsRead, markAllAsRead, archiveNotification, archivedNotifications, archivedLoading, refresh, showAllLoginNotifications } = useNotifications(); // Added showAllLoginNotifications
  const { currentUser } = useAuth(); // Get currentUser

  const [showArchiveAlert, setShowArchiveAlert] = useState(false);
  const [notificationToArchive, setNotificationToArchive] = useState<string | null>(null);
  const [showArchivedModal, setShowArchivedModal] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRefresh = (event: CustomEvent) => {
    refresh();
    event.detail.complete();
  };

  const handleArchiveClick = (notificationId: string) => {
    setNotificationToArchive(notificationId);
    setShowArchiveAlert(true);
  };

  const confirmArchive = async () => {
    if (notificationToArchive) {
      await archiveNotification(notificationToArchive);
      setNotificationToArchive(null);
    }
    setShowArchiveAlert(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_login':
        return sparkles;
      case 'user.medical_record.created':
      case 'user.medical_record.updated':
        return documentTextOutline;
      case 'password_changed':
        return lockClosed;
      case 'registration_approved':
        return checkmarkCircle;
      case 'registration_submitted':
        return mailOutline;
      case 'registration_rejected':
        return alertCircle;
      case 'teleconsultation_request_status_update':
        return alertCircle;
      case 'teleconsultation_request_created':
        return callOutline;
      case 'admin_note':
      case 'new_announcement':
        return mailOutline;
      case 'medicine_request_created':
        return mailOutline;
      case 'medicine_request_status_update':
        return alertCircle;
      default:
        return alertCircle;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'user_login':
        return 'primary';
      case 'password_changed':
        return 'success';
      case 'registration_approved':
        return 'success';
      case 'registration_submitted':
        return 'primary';
      case 'registration_rejected':
        return 'danger';
      case 'teleconsultation_request_status_update':
        return 'warning';
      case 'teleconsultation_request_created':
        return 'primary';
      case 'admin_note':
      case 'new_announcement':
        return 'primary';
      case 'user.medical_record.created':
      case 'user.medical_record.updated':
        return 'primary';
      case 'medicine_request_created':
        return 'primary';
      case 'medicine_request_status_update':
        return 'tertiary';
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
            <IonButton onClick={() => setShowArchivedModal(true)} fill="clear">
              <IonIcon slot="icon-only" icon={folderOpenOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading && (
          <IonList>
            {Array.from({ length: 10 }).map((_, index) => (
              <IonItem key={index}>
                <IonIcon slot="start" size="large" icon={mailOutline} />
                <IonLabel>
                  <h3>
                    <IonSkeletonText animated style={{ width: '60%' }} />
                  </h3>
                  <p>
                    <IonSkeletonText animated style={{ width: '80%' }} />
                  </p>
                  <IonText color="medium">
                    <small>
                      <IonSkeletonText animated style={{ width: '30%' }} />
                    </small>
                  </IonText>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}

        {notifications.length === 0 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '90%' }}>
            <IonCard style={{ maxWidth: '450px', textAlign: 'center' }}>
              <IonCardHeader>
                <IonText className='ion-text-center'>
                  <IonIcon icon={mail} style={{ fontSize: '48px', color: 'var(--ion-color-medium)' }} />
                </IonText>
                <IonCardTitle>No notifications found.</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p className="ion-margin-top">
                  This is where your notifications show up. Make sure to check this page for updates!
                </p>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        <IonList>
          {notifications.map((notification) => (
            <IonItem
              key={notification.id}
              button
              detail={false}
              onClick={() => {
                if (!notification.read) {
                  markAsRead(notification.id);
                }
                if (notification.type === 'user_login' && currentUser) {
                  showAllLoginNotifications(currentUser.uid);
                }
              }}
              className={`notification-item ${!notification.read ? 'unread-notification' : ''}`}>
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
              <IonButton
                fill="clear"
                size="small"
                className="archive-button-corner"
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchiveClick(notification.id);
                }}>
                <IonIcon slot="icon-only" icon={closeOutline} />
              </IonButton>
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

      <IonAlert
        isOpen={showArchiveAlert}
        onDidDismiss={() => setShowArchiveAlert(false)}
        header={'Archive Notification'}
        message={'Are you sure you want to archive this notification? It will no longer appear in your main list.'}
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Archive', handler: confirmArchive },
        ]}
      />

      <ArchivedNotificationsModal
        isOpen={showArchivedModal}
        onDidDismiss={() => setShowArchivedModal(false)}
        archivedNotifications={archivedNotifications}
        archivedLoading={archivedLoading}
        formatTimestamp={formatTimestamp}
        getNotificationIcon={getNotificationIcon}
        getNotificationColor={getNotificationColor}
      />

      <style>
        {`
          .unread-notification {
            background-color: rgba(var(--ion-color-primary-rgb), 0.08);
            border-left: 4px solid var(--ion-color-primary);
          }
          .notification-item {
            position: relative;
          }
          .archive-button-corner {
            position: absolute;
            top: 4px;
            right: 4px;
            --padding-start: 0;
            --padding-end: 0;
          }
        `}
      </style>
    </>
  );
};

interface ArchivedNotificationsModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  archivedNotifications: Notification[];
  archivedLoading: boolean;
  formatTimestamp: (date: Date) => string;
  getNotificationIcon: (type: string) => string;
  getNotificationColor: (type: string) => string;
}

const ArchivedNotificationsModal: React.FC<ArchivedNotificationsModalProps> = ({
  isOpen,
  onDidDismiss,
  archivedNotifications,
  archivedLoading,
  formatTimestamp,
  getNotificationIcon,
  getNotificationColor,
}) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>Archived Notifications</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={archivedLoading} message="Loading archived notifications..." />
        {!archivedLoading && archivedNotifications.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '90%' }}>
            <IonCard style={{ maxWidth: '450px', textAlign: 'center' }}>
              <IonCardHeader>
                <IonText className='ion-text-center'>
                  <IonIcon icon={archiveOutline} style={{ fontSize: '48px', color: 'var(--ion-color-medium)' }} />
                </IonText>
                <IonCardTitle>No archived notifications.</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p className="ion-margin-top">
                  Archived notifications will appear here.
                </p>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {!archivedLoading && archivedNotifications.length > 0 && (
          <IonList>
            {archivedNotifications.map((notification) => (
              <IonItem key={notification.id} detail={false}>
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
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonModal>
  );
};

export default Notifications;