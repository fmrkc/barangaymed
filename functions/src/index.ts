import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

admin.initializeApp();

export { createAdmin } from './createAdminUser';
export { setroleonusercreate } from './auth-triggers';

/**
 * HTTP Cloud Function to log activities securely
 * This function accepts log data and writes it to Firestore with server-side permissions
 */
export const logActivity = functions.https.onCall(async (data, context) => {
  // Validate that the request is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Only authenticated users can log activities'
    );
  }

  // Validate required fields
  const { action, userId, userEmail, role, details } = data;
  
  if (!action || !userId || !userEmail || !role || !details) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: action, userId, userEmail, role, details'
    );
  }

  try {
    // Create the log entry with server timestamp
    const logEntry = {
      action,
      userId,
      userEmail,
      role,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      // Add additional metadata for security
      authUid: context.auth.uid,
      authTime: new Date().toISOString()
    };

    // Write to Firestore
    await admin.firestore().collection('logs').add(logEntry);
    
    return { success: true, message: 'Activity logged successfully' };
  } catch (error) {
    logger.error('Error logging activity:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to log activity'
    );
  }
});

/**
 * Callable function to set a user's role.
 * Only callable by users with the 'superadmin' role.
 * @param {object} data - The data passed to the function.
 * @param {string} data.email - The email of the user to modify.
 * @param {string} data.newRole - The new role to assign ('admin' or 'user').
 * @param {string} [data.barangayId] - The barangayId, required if the new role is 'admin'.
 */
export const setUserRole = functions.https.onCall(async (data, context) => {
  // 1. Authentication and Authorization Check
  // Ensure the user is authenticated and is a superadmin.
  if (context.auth?.token.role !== 'superadmin') {
    logger.error("Attempt to set role by non-superadmin:", { uid: context.auth?.uid });
    throw new functions.https.HttpsError(
      'permission-denied',
      'You must be a superadmin to perform this action.'
    );
  }

  const { email, newRole, barangayId } = data;

  // 2. Input Validation
  if (!email || !newRole || (newRole === 'admin' && !barangayId)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Required fields are missing: email, newRole, and barangayId (for admins).'
    );
  }

  if (!['admin', 'user'].includes(newRole)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Role must be either "admin" or "user".'
    );
  }

  try {
    // 3. Set Custom Claims
    const userToUpdate = await admin.auth().getUserByEmail(email);
    const claims: { role: string; barangayId?: string } = { role: newRole };
    if (newRole === 'admin') {
      claims.barangayId = barangayId;
    }

    await admin.auth().setCustomUserClaims(userToUpdate.uid, claims);

    // 4. Update Firestore Document (to keep data consistent)
    await admin.firestore().collection('users').doc(userToUpdate.uid).update(claims);

    logger.log(`Successfully set role for ${email} to ${newRole}`, claims);
    return { success: true, message: `Role for ${email} updated to ${newRole}.` };
  } catch (error) {
    logger.error("Error in setUserRole:", error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while setting the user role.'
    );
  }
});

/**
 * Example of a protected callable function.
 * Only accessible by users with 'admin' or 'superadmin' roles.
 */
export const adminOnlyOperation = functions.https.onCall((data, context) => {
  // Check for authentication and role.
  const role = context.auth?.token.role;
  if (!role || (role !== 'admin' && role !== 'superadmin')) {
    logger.error("Unauthorized access attempt to adminOnlyOperation:", { uid: context.auth?.uid });
    throw new functions.https.HttpsError(
      'permission-denied',
      'You do not have permission to perform this action.'
    );
  }

  // If the check passes, proceed with the function's logic.
  logger.log(`Admin operation performed by:`, { uid: context.auth?.uid, role: role });
  
  // Example: Return some data only admins should see.
  return {
    success: true,
    message: "Welcome, admin! Here is the secret data.",
    data: {
      superSecretValue: 12345,
      requestingUserBarangay: context.auth?.token.barangayId || 'N/A'
    }
  };
});
