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
  IonModal,
} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationsService } from '../../services/notificationsService';
import { Notification } from '../../types/notifications';
import { checkmarkCircle, alertCircle, mailOutline } from 'ionicons/icons';
import { format } from 'date-fns';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const Notifications: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const [showDetails, setShowDetails] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);

  const notificationsService = NotificationsService.getInstance();
  const db = getFirestore();

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

  const markAsRead = async (notification: Notification) => {
    try {
      await notificationsService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // 🔎 Load details from medicineRequests collection
      if (notification.medicineId) {
        const docRef = doc(db, 'medicineRequests', notification.medicineId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSelectedDetails({ id: docSnap.id, ...docSnap.data() });
          setShowDetails(true);
        }
      }
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
              onClick={() => markAsRead(notification)}
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

      {/* ✅ Details Modal */}
      <IonModal isOpen={showDetails} onDidDismiss={() => setShowDetails(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Request Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {selectedDetails ? (
            <>
              <h2>Status: <IonText color="primary"><b>{selectedDetails.status}</b></IonText></h2>
              <p><b>Medicine:</b> {selectedDetails.medicineName}</p>
              <p><b>Type:</b> {selectedDetails.medicineType}</p>
              <p><b>Quantity:</b> {selectedDetails.quantity}</p>
              <p><b>Request Date:</b> {format(selectedDetails.requestDate.toDate(), 'MMM dd, yyyy • h:mm a')}</p>
              <p><b>Pickup Date:</b> {format(selectedDetails.pickupDate.toDate(), 'MMM dd, yyyy • h:mm a')}</p>
              <p><b>Status Updated:</b> {format(selectedDetails.pickupDate.toDate(), 'MMM dd, yyyy • h:mm a')}</p>
            </>
          ) : (
            <p>Loading details...</p>
          )}

          <IonButton expand="block" onClick={() => setShowDetails(false)}>
            Back
          </IonButton>
        </IonContent>
      </IonModal>

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