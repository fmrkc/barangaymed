import { onMessagePublished } from "firebase-functions/v2/pubsub";
import * as logger from "firebase-functions/logger";
import { sendInAppNotification } from "./services/notificationService.js";

interface UserRegistrationApprovedData {
  userId: string;
}

interface UserRegistrationSubmittedData {
  userId: string;
}

interface UserRegistrationRejectedData {
  userId: string;
  reason: string | null;
}

/**
 * Handles events published to the 'barangaymed-events' Pub/Sub topic.
 * This function will be the central hub for all notifications.
 */
export const onBarangayMedEvent = onMessagePublished("barangaymed-events", async (event) => {
  const eventType = event.data.message.attributes.eventType as string;
  const data = event.data.message.json;

  logger.info(`Received event: ${eventType}`, { data });

  try {
    switch (eventType) {
      case "user.registration.approved": {
        const eventData = data as UserRegistrationApprovedData;
        await sendInAppNotification(eventData.userId, {
          type: "system",
          title: "Account Approved",
          message: "Your registration has been approved. You can now log in.",
        });
        break;
      }

      case "user.registration.submitted": {
        const eventData = data as UserRegistrationSubmittedData;
        await sendInAppNotification(eventData.userId, {
          type: "system",
          title: "Registration Submitted",
          message: "Your full registration request has been received and is pending review.",
        });
        break;
      }

      case "user.registration.rejected": {
        const eventData = data as UserRegistrationRejectedData;
        await sendInAppNotification(eventData.userId, {
          type: "system",
          title: "Registration Rejected",
          message: `Your registration has been rejected. Reason: ${eventData.reason}`,
        });
        break;
      }

      // Add more cases for other event types here

      default:
        logger.warn(`No handler for event type: ${eventType}`);
        break;
    }
  } catch (error) {
    logger.error(`Error handling event ${eventType}:`, error);
  }
});

