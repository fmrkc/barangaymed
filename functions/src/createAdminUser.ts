import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { logger } from "firebase-functions";

/**
 * Callable function to create admin/superadmin users.
 * Only callable by users with the 'superadmin' role.
 * @param {object} data - The data passed to the function.
 * @param {string} data.email - The email of the user to create.
 * @param {string} data.password - The password for the new user.
 * @param {string} data.fullName - The full name of the new user.
 * @param {string} data.role - The role to assign ('admin' or 'superadmin').
 * @param {string} data.barangay - The barangay, required if the role is 'admin'.
 */
export const createAdmin = functions.https.onCall(async (data, context) => {
  // 1. Authentication and Authorization Check
  // Ensure the user is authenticated and is a superadmin.
  if (context.auth?.token.role !== 'superadmin') {
    logger.error("Attempt to create admin by non-superadmin:", { 
      uid: context.auth?.uid,
      attemptedRole: data.role 
    });
    throw new functions.https.HttpsError(
      'permission-denied',
      'You must be a superadmin to perform this action.'
    );
  }

  const { email, password, fullName, role, barangay } = data;

  // 2. Input Validation
  if (!email || !password || !fullName || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Required fields are missing: email, password, fullName, role.'
    );
  }

  if (!['admin', 'superadmin'].includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Role must be either "admin" or "superadmin".'
    );
  }

  if (role === 'admin' && !barangay) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Barangay is required for admin role.'
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

    // 4. Prepare custom claims
    const customClaims: { role: string; barangayId?: string } = { role };
    
    // Add barangay to claims if user is an admin
    if (role === 'admin' && barangay) {
      customClaims.barangayId = barangay;
    }

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
      barangayId?: string;
      barangay?: string;
    } = {
      uid: userRecord.uid,
      email: email,
      name: fullName,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
      createdByEmail: context.auth.token.email
    };

    // Add barangay data for admin users
    if (role === 'admin' && barangay) {
      userDocData.barangayId = barangay;
      userDocData.barangay = barangay;
    }

    await admin.firestore().collection('users').doc(userRecord.uid).set(userDocData);

    // 7. Log the creation event
    logger.log(`Successfully created ${role} user:`, {
      email,
      uid: userRecord.uid,
      createdBy: context.auth.uid,
      barangay: role === 'admin' ? barangay : 'N/A'
    });

    return { 
      success: true, 
      message: `${role} user created successfully.`,
      userId: userRecord.uid,
      email: email
    };
  } catch (error) {
    logger.error("Error creating admin user:", error);
    
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
