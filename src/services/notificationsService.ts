import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Notification } from '../types/notifications';

export class NotificationsService {
  private static instance: NotificationsService;
  private unsubscribe: (() => void) | null = null;

  public static getInstance(): NotificationsService {
    if (!NotificationsService.instance) {
      NotificationsService.instance = new NotificationsService();
    }
    return NotificationsService.instance;
  }

  /**
   * Get notifications for a specific user
   * @param userId The user's ID
   * @param callback Callback function to handle notifications
   * @returns Unsubscribe function
   */
  public getUserNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('timestamp', 'desc')
    );

    this.unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifications: Notification[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          userEmail: data.userEmail,
          type: data.type,
          title: data.title,
          message: data.message,
          timestamp: data.timestamp.toDate(),
          read: data.read,
          metadata: data.metadata || {}
        });
      });

      callback(notifications);
    });

    return () => {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
    };
  }

  /**
   * Get notifications for a user (one-time fetch)
   * @param userId The user's ID
   * @returns Promise with notifications array
   */
  public async getUserNotificationsOnce(userId: string): Promise<Notification[]> {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: data.timestamp.toDate(),
        read: data.read,
        metadata: data.metadata || {}
      });
    });

    return notifications;
  }

  /**
   * Format notification timestamp for display
   * @param timestamp The notification timestamp
   * @returns Formatted string
   */
  public formatNotificationTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return timestamp.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Mark notification as read
   * @param notificationId The notification ID
   */
  public async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });
      console.log(`Notification ${notificationId} marked as read for user ${userId}`);
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  }
}
