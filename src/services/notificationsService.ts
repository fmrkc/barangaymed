import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Notification } from '../types/notifications';
import { executeWithRetry, logFirestoreError } from '../utils/firestoreErrorHandler';
import { logFirestoreEvent, logFirestoreListener } from '../utils/logger';

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
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isShown', '==', true), // Only show active notifications
      orderBy('timestamp', 'desc')
    );

    // Log the listener start
    logFirestoreListener(userId, userEmail, userRole, 'notifications', 'started', {
      operation: 'getUserNotifications'
    });

    const handleSnapshot = (querySnapshot: any) => {
      try {
        const notifications: Notification[] = [];

        querySnapshot.forEach((doc: any) => {
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
            isShown: data.isShown ?? true,
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
        collection(db, 'notifications'),
        where('userId', '==', userId),
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
          isShown: data.isShown ?? true,
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
      const notificationRef = doc(db, 'notifications', notificationId);
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

      console.log(`Notification ${notificationId} marked as read for user ${userId}`);
    } catch (error) {
      logFirestoreError('markAsRead', error, {
        userId,
        notificationId,
        operation: 'markAsRead'
      });
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  }

  /**
   * Mark all unread notifications as read for a user.
   * @param userId The user's ID
   */
  public async markAllAsRead(userId: string): Promise<void> {
    const operation = async () => {
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where('userId', '==', userId), where('read', '==', false));
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

      console.log(`All unread notifications marked as read for user ${userId}`);
    } catch (error) {
      logFirestoreError('markAllAsRead', error, {
        userId,
        operation: 'markAllAsRead'
      });
      console.error(`Error marking all notifications as read for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Archive a notification by setting its isShown field to false.
   * @param notificationId The ID of the notification to archive.
   * @param userId The user's ID.
   */
  public async archiveNotification(notificationId: string, userId: string): Promise<void> {
    const operation = async () => {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isShown: false,
      });
    };

    try {
      await executeWithRetry(
        operation,
        `archiveNotification-${userId}-${notificationId}`,
        { maxRetries: 3 },
        { userId, notificationId, operation: 'archiveNotification' }
      );

      logFirestoreEvent(userId, undefined, undefined, 'write', 'notifications', notificationId, {
        operation: 'archiveNotification',
        success: true
      });

      console.log(`Notification ${notificationId} archived for user ${userId}`);
    } catch (error) {
      logFirestoreError('archiveNotification', error, {
        userId,
        notificationId,
        operation: 'archiveNotification'
      });
      console.error(`Error archiving notification ${notificationId}:`, error);
      throw error;
    }
  }

  /**
   * Show all hidden 'user_login' notifications for a specific user.
   * @param userId The user's ID.
   */
  public async showAllLoginNotifications(userId: string): Promise<void> {
    const operation = async () => {
      const notificationsRef = collection(db, 'notifications');
      const hiddenLoginNotificationsQuery = query(
        notificationsRef,
        where('userId', '==', userId),
        where('type', '==', 'user_login'),
        where('isShown', '==', false)
      );

      const snapshot = await getDocs(hiddenLoginNotificationsQuery);
      if (snapshot.empty) {
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isShown: true });
      });
      await batch.commit();
    };

    try {
      await executeWithRetry(
        operation,
        `showAllLoginNotifications-${userId}`,
        { maxRetries: 3 },
        { userId, operation: 'showAllLoginNotifications' }
      );
      logFirestoreEvent(userId, undefined, undefined, 'write', 'notifications', undefined, {
        operation: 'showAllLoginNotifications',
        success: true
      });
      console.log(`All hidden 'user_login' notifications shown for user ${userId}`);
    } catch (error) {
      logFirestoreError('showAllLoginNotifications', error, {
        userId,
        operation: 'showAllLoginNotifications'
      });
      console.error(`Error showing all hidden 'user_login' notifications for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get archived notifications for a specific user.
   * @param userId The user's ID.
   * @returns Promise with an array of archived notifications.
   */
  public async getArchivedNotifications(userId: string): Promise<Notification[]> {
    const operation = async () => {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isShown', '==', false),
        orderBy('timestamp', 'desc') // Order by created date, descending
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
          isShown: data.isShown ?? true,
          metadata: data.metadata || {}
        });
      });

      return notifications;
    };

    try {
      const archivedNotifications = await executeWithRetry(
        operation,
        `getArchivedNotifications-${userId}`,
        { maxRetries: 3 },
        { userId, operation: 'getArchivedNotifications' }
      );

      logFirestoreEvent(userId, undefined, undefined, 'query', 'notifications', undefined, {
        notificationCount: archivedNotifications.length,
        operation: 'getArchivedNotifications'
      });

      return archivedNotifications;
    } catch (error) {
      logFirestoreError('getArchivedNotifications', error, {
        userId,
        operation: 'getArchivedNotifications'
      });
      throw error;
    }
  }
}
