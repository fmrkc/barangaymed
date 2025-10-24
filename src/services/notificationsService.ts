import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDocs, doc, updateDoc, writeBatch, QuerySnapshot, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Notification } from '../types/notifications';
import { executeWithRetry, logFirestoreError } from '../utils/firestoreErrorHandler';
import { logEvent, logFirestoreEvent, logFirestoreListener } from '../utils/logger';
import { logErrorToConsole } from '../utils/consoleErrorHandler';

export class NotificationsService {
  private static instance: NotificationsService;
  private unsubscribe: (() => void) | null = null;
  private userId: string | null = null;

  public static getInstance(): NotificationsService {
    if (!NotificationsService.instance) {
      NotificationsService.instance = new NotificationsService();
    }
    return NotificationsService.instance;
  }

  /**
   * Get notifications for a specific user with error handling and retry logic
   * @param userId The user's ID
   * @param callback Callback function to handle notifications
   * @returns Unsubscribe function
   */
  public getUserNotifications(userId: string, userEmail: string | undefined, userRole: string | undefined, callback: (notifications: Notification[]) => void): () => void {
    // Clean up existing listener
    this.cleanup();

    this.userId = userId;

    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('timestamp', 'desc')
    );

    // Log the listener start
    logFirestoreListener(userId, userEmail, userRole, 'notifications', 'started', {
      operation: 'getUserNotifications'
    });

    const handleSnapshot = (querySnapshot: QuerySnapshot<DocumentData>) => {
      try {
        const notifications: Notification[] = [];

        querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
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

        // Log successful data retrieval
        logFirestoreEvent(userId, userEmail, userRole, 'listen', 'notifications', undefined, {
          notificationCount: notifications.length,
          operation: 'getUserNotifications'
        });
      } catch (error) {
        logFirestoreError('getUserNotifications', error, {
          userId,
          listenerError: true
        });
      }
    };

    const handleError = (error: Error) => {
      logFirestoreError('getUserNotifications', error, {
        userId,
        listenerError: true
      });
    };

    // Set up the listener with error handling
    this.unsubscribe = onSnapshot(q, handleSnapshot, handleError);

    return () => {
      this.cleanup(userEmail, userRole);
    };
  }

  /**
   * Clean up the current listener
   */
  private cleanup(userEmail?: string, userRole?: string): void {
    if (this.unsubscribe && this.userId) {
      logFirestoreListener(this.userId, userEmail, userRole, 'notifications', 'stopped', {
        operation: 'cleanup'
      });
      this.unsubscribe();
      this.unsubscribe = null;
      this.userId = null;
    }
  }

  /**
   * Get notifications for a user (one-time fetch) with retry logic
   * @param userId The user's ID
   * @returns Promise with notifications array
   */
  public async getUserNotificationsOnce(userId: string): Promise<Notification[]> {
    const operation = async () => {
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
    };

    try {
      const notifications = await executeWithRetry(
        operation,
        `getUserNotificationsOnce-${userId}`,
        { maxRetries: 3 },
        { userId, operation: 'getUserNotificationsOnce' }
      );

      // Log successful operation
      logFirestoreEvent(userId, undefined, undefined, 'query', 'notifications', undefined, {
        notificationCount: notifications.length,
        operation: 'getUserNotificationsOnce'
      });

      return notifications;
    } catch (error) {
      logFirestoreError('getUserNotificationsOnce', error, {
        userId,
        operation: 'getUserNotificationsOnce'
      });
      throw error;
    }
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
   * Mark notification as read with retry logic
   * @param notificationId The notification ID
   * @param userId The user's ID
   */
  public async markAsRead(notificationId: string, userId: string): Promise<void> {
    const operation = async () => {
      const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });
    };

    try {
      await executeWithRetry(
        operation,
        `markAsRead-${userId}-${notificationId}`,
        { maxRetries: 3 },
        { userId, notificationId, operation: 'markAsRead' }
      );

      // Log successful operation
      logFirestoreEvent(userId, undefined, undefined, 'write', 'notifications', notificationId, {
        operation: 'markAsRead',
        success: true
      });

      logEvent('info', `Notification ${notificationId} marked as read for user ${userId}`);
    } catch (error) {
      logFirestoreError('markAsRead', error, {
        userId,
        notificationId,
        operation: 'markAsRead'
      });
      logErrorToConsole(error, `Error marking notification ${notificationId} as read`);
      throw error;
    }
  }

  /**
   * Mark all unread notifications as read for a user.
   * @param userId The user's ID
   */
  public async markAllAsRead(userId: string): Promise<void> {
    const operation = async () => {
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      const q = query(notificationsRef, where('read', '==', false));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return;
      }

      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    };

    try {
      await executeWithRetry(
        operation,
        `markAllAsRead-${userId}`,
        { maxRetries: 3 },
        { userId, operation: 'markAllAsRead' }
      );

      logFirestoreEvent(userId, undefined, undefined, 'write', 'notifications', undefined, {
        operation: 'markAllAsRead',
        success: true
      });

      logEvent('info', `All unread notifications marked as read for user ${userId}`);
    } catch (error) {
      logFirestoreError('markAllAsRead', error, {
        userId,
        operation: 'markAllAsRead'
      });
      logErrorToConsole(error, `Error marking all notifications as read for user ${userId}`);
      throw error;
    }
  }
}