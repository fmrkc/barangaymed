import admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export const onUserDocUpdate = onDocumentUpdated('users/{userId}', async (event) => {
    const userId = event.params.userId;
    const newData = event.data?.after.data();
    const previousData = event.data?.before.data();

    if (!newData || !previousData) {
        logger.log("No data found in change event. Skipping custom claims update.");
        return null;
    }

    const newBarangayId = newData.barangayId;
    const oldBarangayId = previousData.barangayId;
    const newRole = newData.role;
    const oldRole = previousData.role;
    const newVerificationStatus = newData.verificationStatus;
    const oldVerificationStatus = previousData.verificationStatus;

    // Only update claims if relevant fields have changed
    if (newBarangayId === oldBarangayId && newRole === oldRole && newVerificationStatus === oldVerificationStatus) {
      logger.log(`No relevant changes for user ${userId}. Skipping custom claims update.`);
      return null;
    }

    try {
      const user = await admin.auth().getUser(userId);
      const customClaims = { ...user.customClaims };

      let claimsUpdated = false;

      if (newBarangayId !== oldBarangayId && newBarangayId) {
        customClaims.barangayId = newBarangayId;
        claimsUpdated = true;
        logger.log(`Updating barangayId claim for user ${userId} to ${newBarangayId}`);
      }

      if (newRole !== oldRole && newRole) {
        customClaims.role = newRole;
        claimsUpdated = true;
        logger.log(`Updating role claim for user ${userId} to ${newRole}`);
      }

      if (newVerificationStatus !== oldVerificationStatus && newVerificationStatus) {
        customClaims.verificationStatus = newVerificationStatus;
        claimsUpdated = true;
        logger.log(`Updating verificationStatus claim for user ${userId} to ${newVerificationStatus}`);
      }

      if (claimsUpdated) {
        await admin.auth().setCustomUserClaims(userId, customClaims);
        logger.log(`Custom claims updated for user ${userId}:`, customClaims);
      } else {
        logger.log(`No custom claims needed update for user ${userId}.`);
      }

      return null;
    } catch (error) {
      logger.error(`Error updating custom claims for user ${userId}:`, error);
      return null;
    }
  });