import * as functions from "firebase-functions";
import admin from "firebase-admin"; // Corrected import style
import { logger } from "firebase-functions";
import * as nodemailer from 'nodemailer';
import { randomBytes } from "crypto";

// NOTE: admin.initializeApp() is called in index.ts

// Helper to generate a random password
const generatePassword = (length = 12) => {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

// Helper to generate a random admin email
const generateAdminEmail = (domain = "barangaymed.app") => {
  const randomString = randomBytes(4).toString('hex');
  return `admin.${randomString}@${domain}`;
};

/**
 * Callable function to provision a new admin or superadmin user.
 * Creates a user with a random email/password and sends credentials to a contact email.
 */
export const provisionUser = functions.https.onCall(async (data, context) => {
  // 1. Authorization Check
  if (context.auth?.token.email !== 'barangaymed@gmail.com') {
    logger.error("Attempt to provision user by non-authorized user:", { 
      uid: context.auth?.uid,
      email: context.auth?.token.email
    });
    throw new functions.https.HttpsError(
      'permission-denied',
      'You are not authorized to perform this action.'
    );
  }

  const { contactEmail, role, barangayId, fullName } = data;

  // 2. Input Validation
  if (!contactEmail || !role || !fullName) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: contactEmail, fullName, and role.');
  }
  if (!['admin', 'superadmin'].includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Role must be either \'admin\' or \'superadmin\'.');
  }
  if (role === 'admin' && !barangayId) {
    throw new functions.https.HttpsError('invalid-argument', 'Barangay ID is required for admin role.');
  }

  const generatedEmail = generateAdminEmail();
  const temporaryPassword = generatePassword();

  try {
    // 3. Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: generatedEmail,
      password: temporaryPassword,
      displayName: fullName,
      emailVerified: true, // Email is system-generated, so we can consider it verified.
    });

    // 4. Set custom claims
    const customClaims: { role: string; barangayId?: string } = { role };
    if (role === 'admin') {
      customClaims.barangayId = barangayId;
    }
    await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);

    // 5. Create user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: generatedEmail,
      name: fullName,
      role: role,
      barangayId: role === 'admin' ? barangayId : null,
      contactEmail: contactEmail, // Store the contact email for reference
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });

    // 6. Send credentials via email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: functions.config().gmail.email,
        pass: functions.config().gmail.app_password,
      },
    });

    const mailOptions = {
      from: `"BarangayMed+" <${functions.config().gmail.email}>`,
      to: contactEmail,
      subject: 'Your BarangayMed+ Account Credentials',
      html: `
        <p>Hello ${fullName},</p>
        <p>An account has been created for you on BarangayMed+.</p>
        <p><b>Role:</b> ${role}</p>
        ${role === 'admin' ? `<p><b>Assigned Barangay:</b> ${barangayId}</p>` : ''}
        <hr>
        <p>You can log in using these credentials:</p>
        <p><b>Email:</b> ${generatedEmail}</p>
        <p><b>Temporary Password:</b> ${temporaryPassword}</p>
        <hr>
        <p>Please change your password after your first login.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    logger.log(`Successfully provisioned user ${generatedEmail} and sent credentials to ${contactEmail}.`);

    return { 
      success: true, 
      message: `User created successfully. Credentials sent to ${contactEmail}.`,
      newUser: { uid: userRecord.uid, email: generatedEmail }
    };

  } catch (error) {
    logger.error("Error provisioning user:", error);
    // Attempt to delete the user if creation failed after the fact
    const user = await admin.auth().getUserByEmail(generatedEmail).catch(() => null);
    if (user) {
      await admin.auth().deleteUser(user.uid);
    }
    throw new functions.https.HttpsError('internal', 'An error occurred while creating the user.');
  }
});