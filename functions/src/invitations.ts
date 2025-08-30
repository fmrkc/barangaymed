import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { logger } from "firebase-functions";
import { v4 as uuidv4 } from 'uuid';
import * as nodemailer from 'nodemailer';

/**
 * Callable function to send an invitation for admin/superadmin registration.
 * Only callable by superadmins.
 * @param {object} data - The data passed to the function.
 * @param {string} data.email - The email address of the invitee.
 * @param {'admin' | 'superadmin'} data.role - The role to assign to the invitee.
 * @param {string} [data.barangayId] - Required if role is 'admin'.
 */
export const sendInvitation = functions.https.onCall(async (data, context) => {
  // 1. Authentication and Authorization Check
  if (!context.auth || context.auth.token.role !== 'superadmin') {
    logger.warn("Attempt to send invitation by non-superadmin:", { uid: context.auth?.uid });
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only superadmins can send invitations.'
    );
  }

  const { email, role, barangayId } = data;

  // 2. Input Validation
  if (!email || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: email and role.'
    );
  }

  if (!['admin', 'superadmin'].includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Role must be either "admin" or "superadmin".'
    );
  }

  if (role === 'admin' && !barangayId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Barangay ID is required for admin role invitations.'
    );
  }

  try {
    // 3. Generate a unique invitation token
    const invitationToken = uuidv4();
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000); // Token valid for 24 hours

    // 4. Store invitation details in Firestore
    await admin.firestore().collection('invitations').doc(invitationToken).set({
      email: email,
      role: role,
      barangayId: role === 'admin' ? barangayId : null,
      invitedBy: context.auth.uid,
      invitedByEmail: context.auth.token.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: expiresAt,
      status: 'pending',
    });

    // 5. Construct the invitation link (replace with your actual domain)
    const invitationLink = `https://barangaymed.web.app/register-invited?token=${invitationToken}`;

    // 6. Send the invitation email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: functions.config().gmail.email,
        pass: functions.config().gmail.app_password,
      },
    });

    const mailOptions = {
      from: `"BarangayMed+" <${functions.config().gmail.email}>`,
      to: email,
      subject: 'Invitation to join BarangayMed+',
      html: `<p>You have been invited to join BarangayMed+ as a ${role}.</p>
             <p>Click <a href="${invitationLink}">here</a> to register.</p>
             <p>This link is valid for 24 hours.</p>`,
    };

    await transporter.sendMail(mailOptions);

    logger.info(`Invitation email sent to ${email} for role ${role}. Link: ${invitationLink}`);

    return { success: true, message: `Invitation sent to ${email}.` };
  } catch (error) {
    logger.error("Error sending invitation:", error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to send invitation.'
    );
  }
});

/**
 * Callable function to validate an invitation token.
 * @param {object} data - The data passed to the function.
 * @param {string} data.token - The invitation token.
 */
export const validateInvitation = functions.https.onCall(async (data) => {
  // No authentication required for this function, as it's for new users.

  const { token } = data;

  if (!token) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invitation token is missing.'
    );
  }

  try {
    const invitationDoc = await admin.firestore().collection('invitations').doc(token).get();

    if (!invitationDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Invitation not found.'
      );
    }

    const invitationData = invitationDoc.data();

    if (invitationData?.status !== 'pending') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Invitation has already been used or is invalid.'
      );
    }

    if (invitationData?.expiresAt.toDate() < new Date()) {
      throw new functions.https.HttpsError(
        'deadline-exceeded',
        'Invitation has expired.'
      );
    }

    return { 
      success: true, 
      email: invitationData.email, 
      role: invitationData.role, 
      barangayId: invitationData.barangayId || null 
    };
  } catch (error) {
    logger.error("Error validating invitation:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw HttpsError directly
    }
    throw new functions.https.HttpsError(
      'internal',
      'Failed to validate invitation.'
    );
  }
});

/**
 * Callable function to complete the registration for an invited user.
 * @param {object} data - The data passed to the function.
 * @param {string} data.uid - The UID of the newly created Firebase Auth user.
 * @param {string} data.token - The invitation token.
 */
export const completeInvitationRegistration = functions.https.onCall(async (data) => {
  // This function is called by the newly created user, so context.auth should exist.
  // Removed unused 'context' parameter to fix lint error.
  // Note: If context.auth is needed, this should be re-added and used properly.

  const { uid, token } = data;

  if (!uid || !token) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: uid and token.'
    );
  }

  try {
    const invitationDocRef = admin.firestore().collection('invitations').doc(token);
    const invitationDoc = await invitationDocRef.get();

    if (!invitationDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Invitation not found.'
      );
    }

    const invitationData = invitationDoc.data();

    if (invitationData?.status !== 'pending') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Invitation has already been used or is invalid.'
      );
    }

    if (invitationData?.expiresAt.toDate() < new Date()) {
      throw new functions.https.HttpsError(
        'deadline-exceeded',
        'Invitation has expired.'
      );
    }

    // Set custom claims for the newly created user
    const customClaims: { role: string; barangayId?: string } = { role: invitationData.role };
    if (invitationData.barangayId) {
      customClaims.barangayId = invitationData.barangayId;
    }
    await admin.auth().setCustomUserClaims(uid, customClaims);

    // Update user's Firestore document (if it exists, or create it)
    const userDocRef = admin.firestore().collection('users').doc(uid);
    await userDocRef.set({
      email: invitationData.email,
      role: invitationData.role,
      barangayId: invitationData.barangayId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      // Add other relevant fields from invitation if needed
    }, { merge: true });

    // Mark invitation as used
    await invitationDocRef.update({ status: 'used', usedBy: uid, usedAt: admin.firestore.FieldValue.serverTimestamp() });

    logger.info(`Invitation successfully completed for user ${uid} with role ${invitationData.role}.`);

    return { success: true, message: 'Registration completed successfully.' };
  } catch (error) {
    logger.error("Error completing invitation registration:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw HttpsError directly
    }
    throw new functions.https.HttpsError(
      'internal',
      'Failed to complete registration.'
    );
  }
});