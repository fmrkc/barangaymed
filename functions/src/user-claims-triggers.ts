import admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';

function getFilePathFromFirebaseStorageUrl(url: string): string | null {
    // Regex for production URLs
    const productionRegex = /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^\/]+\/o\/(.+)\?alt=media.*/;
    // Regex for emulator URLs
    const emulatorRegex = /http:\/\/localhost:[0-9]+\/v0\/b\/[^\/]+\/o\/(.+)\?alt=media.*/;

    let match = url.match(productionRegex);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    }

    match = url.match(emulatorRegex);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    }

    return null;
}

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

    // --- Verification Document Cleanup Logic ---
    if (previousData.verificationStatus === 'pending_approval' &&
        (newVerificationStatus === 'verified' || newVerificationStatus === 'rejected')) {

        const idVerificationUrl = previousData.idVerificationUrl;

        if (idVerificationUrl) {
            try {
                // Extract file path from Firebase Storage URL
                const filePath = getFilePathFromFirebaseStorageUrl(idVerificationUrl);
                if (filePath) {
                    await admin.storage().bucket().file(filePath).delete();
                    logger.log(`Deleted verification document for user ${userId}: ${filePath}`);

                    // Clean up Firestore document
                    await admin.firestore().collection('users').doc(userId).update({
                        idVerificationUrl: admin.firestore.FieldValue.delete(),
                        idVerificationType: admin.firestore.FieldValue.delete(),
                    });
                    logger.log(`Removed idVerificationUrl and idVerificationType from user ${userId} document.`);
                } else {
                    logger.warn(`Could not extract file path from URL: ${idVerificationUrl} for user ${userId}`);
                }
            } catch (error) {
                logger.error(`Error deleting verification document for user ${userId} from Storage: ${error}`);
            }
        } else {
            logger.log(`No idVerificationUrl found for user ${userId} with status change from pending_approval to ${newVerificationStatus}.`);
        }
    }

    if (newBarangayId === oldBarangayId && newRole === oldRole && newVerificationStatus === oldVerificationStatus && !newData.role) {
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

      // Always set role if it's present in newData, or if it has changed
      if (newRole && (newRole !== oldRole || !customClaims.role)) {
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