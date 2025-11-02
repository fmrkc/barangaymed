import { onCall, HttpsError } from "firebase-functions/v2/https";
import { PubSub } from "@google-cloud/pubsub";
import * as logger from "firebase-functions/logger";

const pubsub = new PubSub();
const topicName = "barangaymed-events";

/**
 * Publishes an event to the 'barangaymed-events' Pub/Sub topic.
 * This function is callable from the client-side.
 */
export const publishBarangayMedEvent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { eventType, data } = request.data;

  if (!eventType || !data) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with 'eventType' and 'data' arguments."
    );
  }

  try {
    const messageId = await pubsub.topic(topicName).publishMessage({
      json: data,
      attributes: { eventType },
    });
    logger.info(`Message ${messageId} published for event type ${eventType}.`);
    return { success: true, messageId };
  } catch (error) {
    logger.error(`Error publishing event ${eventType}:`, error);
    throw new HttpsError("internal", "Failed to publish event.", error);
  }
});