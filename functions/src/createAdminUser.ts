import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

/**
 * Callable function to create superadmin users.
 * Only callable by the designated master superadmin (barangaymed@gmail.com).
 * @param {object} data - The data passed to the function.
 * @param {string} data.email - The email of the user to create.
 * @param {string} data.password - The password for the new user.
 * @param {string} data.fullName - The full name of the new user.
 */
export const createAdmin = functions.https.onCall(async (data, context) => {
  if (context.auth?.token.email !== 'barangaymed@gmail.com') {
    logger.error("Attempt to create superadmin by non-authorized user:", { 
      uid: context.auth?.uid,
      email: context.auth?.token.email
    });
    throw new functions.https.HttpsError(
      'permission-denied',
      'You are not authorized to perform this action.'
    );
  }

  const { email, password, fullName } = data; // Removed role and barangay

  // 2. Input Validation
  if (!email || !password || !fullName) { // Removed role from check
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Required fields are missing: email, password, and fullName.'
    );
  }

  try {
    // 3. Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
      emailVerified: false
    });

    // 4. Prepare custom claims (hardcoded to superadmin)
    const customClaims: { role: string } = { role: 'superadmin' };
    
    // 5. Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);

    // 6. Create user document in Firestore (server-side, bypasses security rules)
    const userDocData: {
      uid: string;
      email: string;
      name: string;
      role: string;
      createdAt: admin.firestore.FieldValue;
      createdBy: string;
      createdByEmail: string | undefined;
    } = {
      uid: userRecord.uid,
      email: email,
      name: fullName,
      role: 'superadmin', // Hardcoded to superadmin
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
      createdByEmail: context.auth.token.email
    };

    await admin.firestore().collection('users').doc(userRecord.uid).set(userDocData);

    // 7. Log the creation event
    logger.log(`Successfully created superadmin user:`, {
      email,
      uid: userRecord.uid,
      createdBy: context.auth.uid,
    });

    return { 
      success: true, 
      message: `Superadmin user created successfully.`,
      userId: userRecord.uid,
      email: email
    };
  } catch (error) {
    logger.error("Error creating superadmin user:", error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('email already exists')) {
        throw new functions.https.HttpsError(
          'already-exists',
          'A user with this email already exists.'
        );
      }
      if (error.message.includes('password')) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Password does not meet requirements.'
        );
      }
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while creating the user.'
    );
  }
});
