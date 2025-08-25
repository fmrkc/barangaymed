import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

admin.initializeApp();

/**
 * On user creation, set custom claims based on the user's role in Firestore.
 * This function reads the user document from Firestore to determine the role
 * and sets appropriate custom claims including role and barangayId if applicable.
 */
export const setroleonusercreate = functions.auth.user().onCreate(async (user) => {
  
  try {
    // Get the user document from Firestore
    const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const role = userData?.role || 'user';
      const barangayId = userData?.barangayId || null;
      
      // Prepare custom claims
      const customClaims: { role: string; barangayId?: string } = { role };
      
      // Add barangayId to claims if user is an admin
      if (barangayId && (role === 'admin' || role === 'super_admin')) {
        customClaims.barangayId = barangayId;
      }
      
      // Set custom claims
      await admin.auth().setCustomUserClaims(user.uid, customClaims);
      logger.log(`Custom claims set for user ${user.uid}:`, customClaims);
    } else {
      // Default to user role if no document exists
      await admin.auth().setCustomUserClaims(user.uid, { role: "user" });
      logger.log(`Default custom claim 'role: user' set for user: ${user.uid}`);
    }
  } catch (error) {
    logger.error("Error setting custom claims:", error);
  }
});
