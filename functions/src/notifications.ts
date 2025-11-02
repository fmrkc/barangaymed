import { onMessagePublished } from "firebase-functions/v2/pubsub";
import * as logger from "firebase-functions/logger";
import admin from "firebase-admin"; // Added import
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

interface MedicineRequestCreatedData {
  requestId: string;
  userId: string;
  medicineName: string;
}

interface MedicineRequestStatusUpdatedData {
  requestId: string;
  userId: string;
  medicineName: string;
  oldStatus: string;
  newStatus: string;
}

interface TeleconsultationRequestCreatedData {
  requestId: string;
  userId: string;
}

interface TeleconsultationRequestStatusUpdatedData {
  requestId: string;
  userId: string;
  oldStatus: string;
  newStatus: string;
}

interface UserLoginSuccessData {
  userId: string;
  userName: string;
}

interface UserMedicalRecordCreatedData {
  userId: string;
  userName: string;
}

interface UserMedicalRecordUpdatedData {
  userId: string;
  userName: string;
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
      case "user.login.success": {
        const eventData = data as UserLoginSuccessData;

        // Hide all previous 'user_login' notifications for this user
        const notificationsRef = admin.firestore().collection('notifications');
        const oldLoginNotificationsQuery = notificationsRef
          .where('userId', '==', eventData.userId)
          .where('type', '==', 'user_login')
          .where('isShown', '==', true);

        const snapshot = await oldLoginNotificationsQuery.get();
        const batch = admin.firestore().batch();
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, { isShown: false });
        });
        await batch.commit();

        // Create the new 'user_login' notification
        await sendInAppNotification(eventData.userId, {
          type: "user_login",
          title: `Welcome, ${eventData.userName}! `,
          message: "You have successfully logged in.",
        });
        break;
      }

      case "user.medical_record.created": {
        const eventData = data as UserMedicalRecordCreatedData;
        await sendInAppNotification(eventData.userId, {
          type: "user.medical_record.created",
          title: "Medical Record Created",
          message: "Your medical record has been successfully created.",
          icon: 'document-text-outline',
        });
        break;
      }

      case "user.medical_record.updated": {
        const eventData = data as UserMedicalRecordUpdatedData;
        await sendInAppNotification(eventData.userId, {
          type: "user.medical_record.updated",
          title: "Medical Record Updated",
          message: "Your medical record has been successfully updated.",
          icon: 'document-text-outline',
        });
        break;
      }
      case "user.registration.approved": {
        const eventData = data as UserRegistrationApprovedData;
        await sendInAppNotification(eventData.userId, {
          type: "registration_approved",
          title: "Welcome to BarangayMed+",
          message: "Your registration has been successfully approved! We’re excited to have you on board. You can now access all features of BarangayMed+, connect with your barangay healthcare team, and manage your medical records anytime, anywhere. Let’s work together for a healthier community.",
        });
        break;
      }

      case "user.registration.submitted": {
        const eventData = data as UserRegistrationSubmittedData;
        await sendInAppNotification(eventData.userId, {
          type: "registration_submitted",
          title: "Registration Submitted",
          message: "Your full registration request has been received and is pending review.",
        });
        break;
      }

      case "user.registration.rejected": {
        const eventData = data as UserRegistrationRejectedData;
        await sendInAppNotification(eventData.userId, {
          type: "registration_rejected",
          title: "Registration Rejected",
          message: `Your registration has been rejected. Reason: ${eventData.reason}`,
        });
        break;
      }

      case "medicine.request.created": {
        const eventData = data as MedicineRequestCreatedData;
        await sendInAppNotification(eventData.userId, {
          type: "medicine_request_created",
          title: "Medicine Request Submitted",
          message: `Your medicine request has been submitted and is pending review.`, 
          metadata: {
            requestId: eventData.requestId,
            medicineName: eventData.medicineName,
          },
        });
        break;
      }

      case "medicine.request.status.updated": {
        const eventData = data as MedicineRequestStatusUpdatedData;
        await sendInAppNotification(eventData.userId, {
          type: "medicine_request_status_update",
          title: `Medicine Request Status: ${eventData.newStatus.charAt(0).toUpperCase() + eventData.newStatus.slice(1)}`,
          message: `Your medicine request has been updated from ${eventData.oldStatus} to ${eventData.newStatus}.`,
          metadata: {
            requestId: eventData.requestId,
            medicineName: eventData.medicineName,
            oldStatus: eventData.oldStatus,
            newStatus: eventData.newStatus,
          },
        });
        break;
      }

      case "teleconsultation.request.created": {
        const eventData = data as TeleconsultationRequestCreatedData;
        await sendInAppNotification(eventData.userId, {
          type: "teleconsultation_request_created",
          title: "Teleconsultation Request Submitted",
          message: "Your teleconsultation request has been submitted and is pending review.",
          metadata: {
            requestId: eventData.requestId,
          },
        });
        break;
      }

      case "teleconsultation.request.status.updated": {
        const eventData = data as TeleconsultationRequestStatusUpdatedData;
        await sendInAppNotification(eventData.userId, {
          type: "teleconsultation_request_status_update",
          title: `Teleconsultation Request Status: ${eventData.newStatus.charAt(0).toUpperCase() + eventData.newStatus.slice(1)}`,
          message: `Your teleconsultation request has been updated from ${eventData.oldStatus} to ${eventData.newStatus}.`,
          metadata: {
            requestId: eventData.requestId,
            oldStatus: eventData.oldStatus,
            newStatus: eventData.newStatus,
          },
        });
        break;
      }

      default:
        logger.warn(`No handler for event type: ${eventType}`);
        break;
    }
  } catch (error) {
    logger.error(`Error handling event ${eventType}:`, error);
  }
});
