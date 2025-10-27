import * as admin from "firebase-admin";
import { Notification } from "../types/notifications.js";

/**
 * Sends an in-app notification to a user.
 * @param {string} userId The ID of the user to send the notification to.
 * @param {Partial<Notification>} notificationData The notification data.
 */
export const sendInAppNotification = async (
  userId: string,
  notificationData: Partial<Notification>
) => {
  if (!userId) {
    throw new Error("User ID is required to send an in-app notification.");
  }

  const notificationRef = admin.firestore().collection("notifications");

  const notification: Omit<Notification, 'id'> = {
    userId: userId, // Add userId to the notification document
    type: notificationData.type || 'system',
    title: notificationData.title || "",
    message: notificationData.message || "",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    read: false,
    isShown: true,
    ...notificationData,
  };

  await notificationRef.add(notification);
};
