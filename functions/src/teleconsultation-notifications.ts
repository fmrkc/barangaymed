import { onMessagePublished } from "firebase-functions/v2/pubsub";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const db = getFirestore();
const auth = getAuth();

/**
 * Handles Pub/Sub messages for teleconsultation request events and creates notifications.
 */
export const onTeleconsultationEvent = onMessagePublished('barangaymed-events', async (event) => {
  const message = event.data.message;
  if (!message || !message.attributes || !message.data) {
    logger.warn('Invalid Pub/Sub message format.');
    return;
  }

  const eventType = message.attributes.eventType;
  const data = JSON.parse(Buffer.from(message.data, 'base64').toString());

  logger.info(`Received event: ${eventType}`, data);

  let notificationTitle: string;
  let notificationMessage: string;
  let targetUserId: string;

  switch (eventType) {
    case 'teleconsultation.request.created':
      targetUserId = data.userId;
      notificationTitle = 'Teleconsultation Request Submitted';
      notificationMessage = 'Your teleconsultation request has been submitted and is awaiting review.';
      break;
    case 'teleconsultation.request.status.updated':
      targetUserId = data.userId;
      const newStatus = data.newStatus;
      const oldStatus = data.oldStatus;

      if (newStatus === 'accepted') {
        notificationTitle = 'Teleconsultation Request Accepted';
        notificationMessage = 'Your teleconsultation request has been accepted. Please check the details for scheduling.';
      } else if (newStatus === 'scheduled') {
        notificationTitle = 'Teleconsultation Scheduled';
        notificationMessage = `Your teleconsultation has been scheduled for ${new Date(data.startTime).toLocaleString()}. Check details for meeting link.`;
      } else if (newStatus === 'rejected') {
        notificationTitle = 'Teleconsultation Request Rejected';
        notificationMessage = `Your teleconsultation request has been rejected. Reason: ${data.rejectionReason || 'N/A'}.`;
      } else if (newStatus === 'cancelled') {
        notificationTitle = 'Teleconsultation Request Cancelled';
        notificationMessage = 'Your teleconsultation request has been cancelled.';
      } else if (newStatus === 'completed') {
        notificationTitle = 'Teleconsultation Completed';
        notificationMessage = 'Your teleconsultation has been marked as completed.';
      } else if (newStatus === 'no show') {
        notificationTitle = 'Teleconsultation No Show';
        notificationMessage = 'Your teleconsultation was marked as a no-show.';
      } else {
        logger.info(`Unhandled status update for teleconsultation request ${data.requestId}: ${oldStatus} -> ${newStatus}`);
        return;
      }
      break;
    default:
      logger.warn(`No handler for event type: ${eventType}`);
      return;
  }

  try {
    const userRecord = await auth.getUser(targetUserId);
    const userEmail = userRecord.email;

    await db.collection('notifications').add({
      userId: targetUserId,
      userEmail: userEmail,
      type: 'teleconsultation',
      title: notificationTitle,
      message: notificationMessage,
      timestamp: FieldValue.serverTimestamp(),
      read: false,
      metadata: data, // Store all event data in metadata
    });
    logger.info(`Notification created for user ${targetUserId} for event ${eventType}`);
  } catch (error) {
    logger.error(`Error creating notification for event ${eventType} for user ${targetUserId}:`, error);
  }
});
