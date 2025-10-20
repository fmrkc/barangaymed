import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { logger } from "firebase-functions/v2";
import express from 'express';
import cors from 'cors';
import { defineSecret } from 'firebase-functions/params';
import { provisionUserV2 } from "./v2/registration.js";

// Explicitly set the Auth emulator host if running in the emulator
if (process.env.FUNCTIONS_EMULATOR) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
}

const GMAIL_EMAIL = defineSecret('GMAIL_EMAIL');
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');


if (admin.apps.length === 0) {
  admin.initializeApp();
}

const app = express();
const allowedOrigins = [
  'http://localhost:8100',
  'http://localhost:8101',
  'https://barangaymed.web.app',
  'https://api-gy7oflie2a-uc.a.run.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Log Activity route
app.post('/logActivityV2', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { action, userId, userEmail, role, details } = req.body;
    if (!action || !userId || !userEmail || !role || !details) {
      res.status(400).json({ error: 'Missing required fields: action, userId, userEmail, role, details' });
      return;
    }

    const logEntry = {
      action,
      userId,
      userEmail,
      role,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      authTime: new Date().toISOString()
    };

    await admin.firestore().collection('users').doc(userId).collection('logs').add(logEntry);
    res.json({ success: true, message: 'Activity logged successfully' });
  } catch (error) {
    logger.error('Error logging activity:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// Set User Role route
app.post('/setUserRoleV2', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { email, newRole, barangayId } = req.body;

    if (!email || !newRole || (newRole === 'admin' && !barangayId)) {
      res.status(400).json({ error: 'Required fields are missing: email, newRole, and barangayId (for admins).' });
      return;
    }

    if (!['admin', 'user'].includes(newRole)) {
      res.status(400).json({ error: 'Role must be either "admin" or "user".' });
      return;
    }

    const userToUpdate = await admin.auth().getUserByEmail(email);
    const claims: { role: string; barangayId?: string; verificationStatus: string } = {
      role: newRole,
      verificationStatus: 'verified' // Set to verified when role is updated
    };
    if (newRole === 'admin') {
      claims.barangayId = barangayId;
    }

    await admin.auth().setCustomUserClaims(userToUpdate.uid, claims);
    await admin.firestore().collection('users').doc(userToUpdate.uid).update(claims);

    logger.log(`Successfully set role for ${email} to ${newRole}`, claims);
    res.json({ success: true, message: `Role for ${email} updated to ${newRole}.` });
  } catch (error) {
    logger.error("Error in setUserRole:", error);
    res.status(500).json({ error: 'An error occurred while setting the user role.' });
  }
});

// Get Announcements by Barangay route
app.get('/getAnnouncementsByBarangayV2', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'User ID required' });
      return;
    }

    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User document not found' });
      return;
    }
    const userData = userDoc.data();
    const barangayId = userData?.barangayId;

    if (!barangayId) {
      res.status(400).json({ error: 'User barangay not found' });
      return;
    }

    const announcementsRef = admin.firestore().collection('announcements');
    const snapshot = await announcementsRef
      .where('barangayId', '==', barangayId)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const announcements = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        barangayId: data.barangayId,
        createdBy: data.createdBy,
        createdByEmail: data.createdByEmail,
        createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : data.updatedAt ? new Date(data.updatedAt) : undefined,
        isActive: data.isActive,
        priority: data.priority,
        images: data.images || []
      };
    });

    res.json({ announcements });
  } catch (error) {
    logger.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Submit Full Registration route
app.post('/submitFullRegistrationV2', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { registrationDetails } = req.body;
    if (!registrationDetails) {
      res.status(400).json({ error: 'Missing registrationDetails' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const userId = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      res.status(400).json({ error: 'Email not found in token' });
      return;
    }

    const {
      lotBlkHouseNo, streetName, subdivisionVillageZonePurok, zipCode, contactNumber,
      barangayId, idVerificationUrl, idVerificationType
    } = registrationDetails;

    const db = admin.firestore();
    const userDocRef = db.collection('users').doc(userId);

    // 1. Update the main user document
    await userDocRef.update({
      ...registrationDetails,
    });

    // 2. Create a new document in the full_registration sub-collection
    const fullRegRef = userDocRef.collection('full_registration');
    await fullRegRef.add({
      status: 'pending',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      idVerificationUrl: registrationDetails.idVerificationUrl,
      idVerificationType: registrationDetails.idVerificationType,
      barangayId: registrationDetails.barangayId,
      // Denormalized user data for efficient admin queries
      firstName: decodedToken.name.split(' ')[0] || 'N/A',
      lastName: decodedToken.name.split(' ').slice(1).join(' ') || 'N/A',
      email: email,
    });

    // 3. Set custom claim to pending
    const currentClaims = (await admin.auth().getUser(userId)).customClaims;
    await admin.auth().setCustomUserClaims(userId, { 
      ...currentClaims,
      verificationStatus: 'pending' 
    });



    // 4. Send confirmation email (optional, can be kept or removed)
    const subject = "BarangayMed+ Full Registration Request Received";
    const htmlContent = `
<p>Dear User,</p>
<p>Thank you for submitting your full registration request to BarangayMed+.</p>
<p>Your request has been successfully received and will be reviewed by our administrators soon.</p>
<p>Here are the details you submitted:</p>
<ul>
  <li><strong>Email:</strong> ${email}</li>
  <li><strong>Address:</strong> ${[lotBlkHouseNo, streetName, subdivisionVillageZonePurok, barangayId, zipCode].filter(Boolean).join(', ')}</li>
  <li><strong>Contact Number:</strong> ${contactNumber}</li>
  <li><strong>Barangay:</strong> ${barangayId}</li>
  ${idVerificationUrl ? `<li><strong>${idVerificationType}:</strong> <a href="${idVerificationUrl}">View Document</a></li>` : ''}
</ul>
<p>You will receive another notification once your request has been reviewed.</p>
<p>Sincerely,</p>
<p>The BarangayMed+ Team</p>
`;

    try {
      const { sendEmail } = await import('./email.js');
      await sendEmail({
        to: email,
        subject: subject,
        html: htmlContent,
      }, GMAIL_EMAIL.value(), GMAIL_APP_PASSWORD.value());

      await admin.firestore().collection("notifications").add({
        userId: userId,
        title: "Full Registration Request Received",
        message: "Your full registration request has been received and is pending review.",
        type: "full_registration_status",
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: registrationDetails,
      });

      res.json({ success: true, message: "Full registration confirmation sent." });
    } catch (error) {
      logger.error("Error sending full registration confirmation:", error);
      res.status(500).json({ error: 'Failed to send confirmation.' });
    }
  } catch (error) {
    logger.error('Error in submitFullRegistration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Only Operation route
app.get('/adminOnlyOperationV2', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const role = req.query.role as string;
    if (!role || (role !== 'admin' && role !== 'superadmin')) {
      logger.error("Unauthorized access attempt to adminOnlyOperation");
      res.status(403).json({ error: 'You do not have permission to perform this action.' });
      return;
    }

    logger.log(`Admin operation performed by:`, { role: role });

    res.json({
      success: true,
      message: "Welcome, admin! Here is the secret data.",
      data: {
        superSecretValue: 12345,
        requestingbarangayId: req.query.barangayId || 'N/A'
      }
    });
  } catch (error) {
    logger.error('Error in adminOnlyOperation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Philippine Addresses route
app.get('/getPhilippineAddresses', async (req, res) => {
  try {
    const addressesData = (await import('../philippine-addresses.json', { with: { type: 'json' } })).default;
    res.json(addressesData);
  } catch (error) {
    logger.error('Error fetching Philippine addresses:', error);
    res.status(500).json({ error: 'Failed to fetch Philippine addresses' });
  }
});





export const provisionUser = onCall(provisionUserV2);

export const reviewUserRegistration = onCall({ cors: true, secrets: [GMAIL_EMAIL, GMAIL_APP_PASSWORD] }, async (request) => {
  if (!request.auth || (request.auth.token.role !== 'admin' && request.auth.token.role !== 'superadmin')) {
    throw new HttpsError('permission-denied', 'You must be an admin or superadmin to perform this action.');
  }

  const { userId, attemptId, action, reason } = request.data;
  if (!userId || !attemptId || !action || (action === 'rejected' && !reason)) {
    throw new HttpsError('invalid-argument', 'Missing required fields: userId, attemptId, action, and reason for rejection.');
  }

  const adminId = request.auth.uid;
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  const fullRegRef = userRef.collection('full_registration').doc(attemptId);

  try {
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User to be reviewed not found.');
    }
    const userData = userDoc.data()!;

    // Security Check: Ensure admin belongs to the same barangay or is a superadmin
    if (request.auth.token.role === 'admin' && userData.barangayId !== request.auth.token.barangayId) {
      throw new HttpsError('permission-denied', 'Admins can only review users in their own barangay.');
    }

    let emailMessage: string;
    let notificationMessage: string;
    let notificationType: string;

    if (action === 'verified') {
      // 1. Update registration sub-collection status
      await fullRegRef.update({
        status: 'verified',
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: adminId,
      });

      // 2. Update main user document and custom claims
      await userRef.update({ verificationStatus: 'verified' });
      await admin.auth().setCustomUserClaims(userId, { role: 'user', verificationStatus: 'verified', barangayId: userData.barangayId });
      await admin.auth().revokeRefreshTokens(userId);

      notificationMessage = 'Congratulations! Your registration has been verified. You can now access all features.';
      notificationType = 'registration_verified';
      emailMessage = 'Your registration has been approved!';

    } else if (action === 'rejected') {
      // 1. Update registration sub-collection status
      await fullRegRef.update({
        status: 'rejected',
        rejectionReason: reason,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        reviewedBy: adminId,
      });

      // 2. Update main user document
      await userRef.update({ verificationStatus: 'rejected', rejectionReason: reason });

      notificationMessage = `Your registration has been rejected. Reason: ${reason}`;
      notificationType = 'registration_rejected';
      emailMessage = `Your registration has been rejected for the following reason: ${reason}`;

    } else {
      throw new HttpsError('invalid-argument', 'Action must be either "verified" or "rejected".');
    }

    // 3. Add a notification for the user
    await db.collection('notifications').add({
      userId: userId,
      title: `Registration ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: notificationMessage,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      type: notificationType,
    });

    // 4. Send email notification
    const { sendEmail } = await import('./email.js');
    await sendEmail({
        to: userData.email,
        subject: `BarangayMed+ Registration Status: ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        html: `<p>Dear ${userData.firstName || 'User'},</p><p>${emailMessage}</p>`,
    }, GMAIL_EMAIL.value(), GMAIL_APP_PASSWORD.value());

    return { success: true, message: `User has been ${action}.` };

  } catch (error) {
    logger.error(`Error reviewing user registration for ${userId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'An unexpected error occurred while reviewing the user.');
  }
});// Export the Express app as a Firebase Function
export const api = onRequest({ secrets: [GMAIL_EMAIL, GMAIL_APP_PASSWORD] }, app);

export { onUserDocUpdate } from './user-claims-triggers.js';
export * from "./user-verification.js";

