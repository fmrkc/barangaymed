import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDocs } from 'firebase/firestore';
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
      collection(db, 'logs'),
      where('metadata.requestId', '!=', null),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    this.unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifications: Notification[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Only include medicine request status updates
        if (data.metadata?.action === 'medicine_request_status_update') {
          const notification: Notification = {
            id: doc.id,
            userId: data.userId,
            userEmail: data.userEmail,
            type: 'status_change',
            title: `Request Status Updated`,
            message: `Your request for ${data.metadata.medicineName || 'medicine'} has been updated from ${data.metadata.oldStatus} to ${data.metadata.newStatus}`,
            timestamp: data.timestamp.toDate(),
            read: false, // Default to unread
            metadata: {
              requestId: data.metadata.requestId,
              oldStatus: data.metadata.oldStatus,
              newStatus: data.metadata.newStatus,
              medicineName: data.metadata.medicineName
            }
          };
          notifications.push(notification);
        }
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
      collection(db, 'logs'),
      where('metadata.action', '==', 'medicine_request_status_update'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const notification: Notification = {
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        type: 'status_change',
        title: `Request Status Updated`,
        message: `Your request for ${data.metadata.medicineName || 'medicine'} has been updated from ${data.metadata.oldStatus} to ${data.metadata.newStatus}`,
        timestamp: data.timestamp.toDate(),
        read: false,
        metadata: {
          requestId: data.metadata.requestId,
          oldStatus: data.metadata.oldStatus,
          newStatus: data.metadata.newStatus,
          medicineName: data.metadata.medicineName
        }
      };
      notifications.push(notification);
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
  public async markAsRead(notificationId: string): Promise<void> {
    // In a real implementation, you might want to store read status
    // For now, we'll handle this in the component state
    console.log(`Marking notification ${notificationId} as read`);
  }
}
