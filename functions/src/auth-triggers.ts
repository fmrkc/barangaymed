import { beforeUserCreated } from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

export const setroleonusercreate = beforeUserCreated(async (event) => {
  const user = event.data;
  if (!user) {
    logger.error("User data is undefined in beforeUserCreated event.");
    return;
  }
  try {
    // Get the user document from Firestore
    const userDoc = await admin.firestore().collection('users').doc(user.uid).get();

    let role = 'user';
    let barangayId = null;
    let verificationStatus = 'unverified';

    if (userDoc.exists) {
      const userData = userDoc.data();
      role = userData?.role || 'user';
      barangayId = userData?.barangayId || null;
      verificationStatus = userData?.verificationStatus || 'unverified';
    } else {
      // If user document doesn't exist, create a basic one
      await admin.firestore().collection('users').doc(user.uid).set({
        email: user.email,
        role: 'user',
        verificationStatus: 'unverified',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }); // Use merge: true to avoid overwriting if it was just created
      logger.log(`Created basic user document for ${user.uid} as it did not exist.`);
    }

    // Prepare custom claims
    const customClaims: { role: string; barangayId?: string; verificationStatus: string } = {
      role,
      verificationStatus
    };

    // Add barangayId to claims if user is an admin
    if (barangayId && (role === 'admin' || role === 'superadmin')) {
      customClaims.barangayId = barangayId;
    }

    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, customClaims);
    logger.log(`Custom claims set for user ${user.uid}:`, customClaims);
  } catch (error) {
    logger.error("Error setting custom claims:", error);
  }
});
