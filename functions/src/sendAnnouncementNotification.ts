import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from 'firebase-admin';
import { logger } from "firebase-functions";

/**
 * Callable function to send notifications to all users in a specific barangay
 * about a new or unprivated announcement.
 */
export const sendAnnouncementNotification = onCall(async (request) => {
  // 1. Authentication and Authorization Check (Optional, depending on who can trigger this)
  // For now, assuming this is called by an admin action from the client, 
  // so we might want to check if the caller is an admin.
  if (!request.auth || (request.auth.token.role !== 'admin' && request.auth.token.role !== 'superadmin')) {
    logger.error('Permission denied: Non-admin/superadmin attempted to send announcement notifications.', { uid: request.auth?.uid });
    throw new HttpsError(
      'permission-denied',
      'Only authenticated admins or superadmins can send announcement notifications.'
    );
  }

  const { announcementId, announcementTitle, barangayId } = request.data;

  // 2. Input Validation
  if (!announcementId || !announcementTitle || !barangayId) {
    logger.error('Invalid argument: Missing required fields for sendAnnouncementNotification.', { announcementId, announcementTitle, barangayId });
    throw new HttpsError(
      'invalid-argument',
      'Missing required fields: announcementId, announcementTitle, or barangayId.'
    );
  }

  logger.info(`Received request to send notification for announcement ${announcementId} in barangay ${barangayId}.`);

  try {
    // 3. Query users in the specified barangay
    const usersRef = admin.firestore().collection('users');
    const q = usersRef.where('barangayId', '==', barangayId);
    const querySnapshot = await q.get();

    logger.info(`Found ${querySnapshot.size} users in barangay ${barangayId}.`);

    if (querySnapshot.empty) {
      logger.info(`No users found in barangay ${barangayId} to notify.`);
      return { success: true, message: 'No users to notify.' };
    }

    const notificationsBatch = admin.firestore().batch();
    const notificationMessage = `New Announcement: ${announcementTitle}`;

    // 4. Create a notification for each user
    querySnapshot.forEach(doc => {
      const userId = doc.id;
      const notificationRef = admin.firestore().collection('users').doc(userId).collection('notifications').doc();
      notificationsBatch.set(notificationRef, {
        title: 'New Announcement',
        message: notificationMessage,
        type: 'new_announcement',
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        announcementId: announcementId // Link to the announcement
      });
    });

    await notificationsBatch.commit();

    logger.info(`Successfully sent new announcement notification to ${querySnapshot.size} users in barangay ${barangayId}.`);
    return { success: true, message: `Notifications sent to ${querySnapshot.size} users.` };

  } catch (error) {
    logger.error('Error sending announcement notifications:', error, { announcementId, announcementTitle, barangayId });
    throw new HttpsError(
      'internal',
      'Failed to send announcement notifications.',
      error
    );
  }
});
