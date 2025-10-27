import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { PubSub } from '@google-cloud/pubsub';
import * as logger from "firebase-functions/logger";

const pubSubClient = new PubSub();
const topicName = 'barangaymed-events';

/**
 * Triggered when a new medicine request is created.
 * Publishes a 'medicine.request.created' event to Pub/Sub.
 */
export const onMedicineRequestCreated = onDocumentCreated('medicineRequests/{requestId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.warn('No data associated with the event');
    return;
  }

  const requestId = snapshot.id;
  const requestData = snapshot.data();
  const userId = requestData.userId;
  const medicineName = requestData.medicineName || 'N/A'; // Assuming medicineName exists

  if (!userId) {
    logger.error(`Medicine request ${requestId} has no userId. Cannot publish event.`);
    return;
  }

  try {
    const dataBuffer = Buffer.from(JSON.stringify({ requestId, userId, medicineName }));
    await pubSubClient.topic(topicName).publishMessage({
      data: dataBuffer,
      attributes: { eventType: 'medicine.request.created' }
    });
    logger.info(`Published medicine.request.created event for request ${requestId} by user ${userId}`);
  } catch (error) {
    logger.error(`Failed to publish medicine.request.created event for request ${requestId}:`, error);
  }
});

/**
 * Triggered when a medicine request is updated.
 * Publishes a 'medicine.request.status.updated' event to Pub/Sub if the status changes.
 */
export const onMedicineRequestUpdated = onDocumentUpdated('medicineRequests/{requestId}', async (event) => {
  if (!event.data) {
    logger.warn('No data associated with the update event');
    return;
  }
  const oldSnapshot = event.data.before;
  const newSnapshot = event.data.after;

  if (!oldSnapshot || !newSnapshot) {
    logger.warn('No data associated with the update event');
    return;
  }

  const requestId = newSnapshot.id;
  const oldData = oldSnapshot.data();
  const newData = newSnapshot.data();
  const userId = newData.userId;
  const medicineName = newData.medicineName || 'N/A'; // Assuming medicineName exists

  if (!userId) {
    logger.error(`Medicine request ${requestId} has no userId. Cannot publish event.`);
    return;
  }

  // Check if the status has changed
  if (oldData.status !== newData.status) {
    try {
      const dataBuffer = Buffer.from(JSON.stringify({
        requestId,
        userId,
        medicineName,
        oldStatus: oldData.status,
        newStatus: newData.status,
      }));
      await pubSubClient.topic(topicName).publishMessage({
        data: dataBuffer,
        attributes: { eventType: 'medicine.request.status.updated' }
      });
      logger.info(`Published medicine.request.status.updated event for request ${requestId} by user ${userId}: ${oldData.status} -> ${newData.status}`);
    } catch (error) {
      logger.error(`Failed to publish medicine.request.status.updated event for request ${requestId}:`, error);
    }
  }
});
