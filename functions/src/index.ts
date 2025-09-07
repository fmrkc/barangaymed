import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { logger } from "firebase-functions";
import * as functions from "firebase-functions"; // Import config
import express from 'express';
import cors from 'cors';
import { defineSecret } from 'firebase-functions/params';
import * as nodemailer from 'nodemailer';
import { randomBytes } from "crypto";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const GMAIL_EMAIL = defineSecret('GMAIL_EMAIL');
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');

// Load addressesData asynchronously
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const addressesDataPath = path.resolve(__dirname, '../philippine-addresses.json');
let addressesData: AddressesDataType | null = null;

async function getAddressesData(): Promise<AddressesDataType> {
  if (addressesData) {
    return addressesData;
  }
  const data = await fs.promises.readFile(addressesDataPath, 'utf8');
  const parsedData: AddressesDataType = JSON.parse(data);
  addressesData = parsedData;
  return parsedData;
}


interface BarangayData {
  code: string;
  name: string;
}

interface CityMunData {
  name: string;
  barangay_list: BarangayData[];
}

interface ProvinceData {
  name: string;
  municipality_list: { [key: string]: CityMunData };
}

interface RegionData {
  region_name: string;
  province_list: { [key: string]: ProvinceData };
}

interface AddressesDataType {
  [key: string]: RegionData;
}

admin.initializeApp();

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

// Helper to generate a random password
const generatePassword = (length = 12) => {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

// Helper to generate a random admin email
const generateAdminEmail = (domain = "barangaymed.app") => {
  const randomString = randomBytes(4).toString('hex');
  return `admin.${randomString}@${domain}`;
};

async function getCityMunicipalityIdFromBarangayId(barangayId: string): Promise<string | undefined> {
  const typedAddressesData = await getAddressesData();

  for (const regionCode in typedAddressesData) {
    const regionData = typedAddressesData[regionCode];
    for (const provinceCode in regionData.province_list) {
      const provinceData = regionData.province_list[provinceCode];
      for (const cityMunCode in provinceData.municipality_list) {
        const cityMunData = provinceData.municipality_list[cityMunCode];
        const barangayList = cityMunData.barangay_list;
        if (barangayList.some(brgy => brgy.code === barangayId)) {
          return cityMunCode;
        }
      }
    }
  }
  return undefined;
}

// Individual functions are now handled by the Express app routes
// No need to export them separately

// Log Activity route
app.post('/logActivityV2', async (req, res) => {
  try {
    // Authentication check (simplified)
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

    await admin.firestore().collection('logs').add(logEntry);
    res.json({ success: true, message: 'Activity logged successfully' });
  } catch (error) {
    logger.error('Error logging activity:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// Set User Role route
app.post('/setUserRoleV2', async (req, res) => {
  try {
    // Authentication check (simplified)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { email, newRole, barangayId } = req.body;

    // Input Validation
    if (!email || !newRole || (newRole === 'admin' && !barangayId)) {
      res.status(400).json({ error: 'Required fields are missing: email, newRole, and barangayId (for admins).' });
      return;
    }

    if (!['admin', 'user'].includes(newRole)) {
      res.status(400).json({ error: 'Role must be either "admin" or "user".' });
      return;
    }

    // Set Custom Claims
    const userToUpdate = await admin.auth().getUserByEmail(email);
    const claims: { role: string; barangayId?: string } = { role: newRole };
    if (newRole === 'admin') {
      claims.barangayId = barangayId;
    }

    await admin.auth().setCustomUserClaims(userToUpdate.uid, claims);

    // Update Firestore Document
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
    // Authentication check (simplified)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // For simplicity, we'll expect userId in query params
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: 'User ID required' });
      return;
    }

    // Get the user's barangay from their document
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

    // Query announcements for the user's barangay
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
    // Authentication check (simplified)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    const { registrationDetails } = req.body;
    if (!registrationDetails) {
      res.status(400).json({ error: 'Missing registrationDetails' });
      return;
    }

    // Get user info from the token (simplified - in production, verify the token properly)
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
      barangayId, barangayIdUrl, barangayCertificateUrl
    } = registrationDetails;

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
  ${barangayIdUrl ? `<li><strong>Barangay ID:</strong> <a href="${barangayIdUrl}">View Document</a></li>` : ''}
  ${barangayCertificateUrl ? `<li><strong>Barangay Certificate:</strong> <a href="${barangayCertificateUrl}">View Document</a></li>` : ''}
</ul>
<p>You will receive another notification once your request has been reviewed.</p>
<p>Sincerely,</p>
<p>The BarangayMed+ Team</p>
`;

    try {
      // Send email confirmation
      const { sendEmail } = await import('./email.js');
      await sendEmail({
        to: email,
        subject: subject,
        html: htmlContent,
      }, GMAIL_EMAIL.value(), GMAIL_APP_PASSWORD.value());

      // Create notification in Firestore
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
    // Authentication check (simplified)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // For simplicity, we'll expect role in query params
    const role = req.query.role as string;
    if (!role || (role !== 'admin' && role !== 'superadmin')) {
      logger.error("Unauthorized access attempt to adminOnlyOperation");
      res.status(403).json({ error: 'You do not have permission to perform this action.' });
      return;
    }

    // If the check passes, proceed with the function's logic.
    logger.log(`Admin operation performed by:`, { role: role });

    // Example: Return some data only admins should see.
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
    const data = await getAddressesData();
    // No authentication needed for public address data
    res.json(data);
  } catch (error) {
    logger.error('Error fetching Philippine addresses:', error);
    res.status(500).json({ error: 'Failed to fetch Philippine addresses' });
  }
});

// Helper function to get barangay code from name
async function getBarangayCodeFromName(barangayName: string): Promise<string | undefined> {
  const typedAddressesData = await getAddressesData();

  for (const regionCode in typedAddressesData) {
    const regionData = typedAddressesData[regionCode];
    for (const provinceCode in regionData.province_list) {
      const provinceData = regionData.province_list[provinceCode];
      for (const cityMunCode in provinceData.municipality_list) {
        const cityMunData = provinceData.municipality_list[cityMunCode];
        const barangayList = cityMunData.barangay_list;
        const foundBarangay = barangayList.find((brgy: BarangayData) => brgy.name === barangayName);
        if (foundBarangay) {
          return foundBarangay.code;
        }
      }
    }
  }
  return undefined;
}

export const standardizeAdminBarangayIds = onCall(async (request) => {
  if (request.auth?.token.role !== 'superadmin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only superadmins can standardize admin barangay IDs.'
    );
  }

  const db = admin.firestore();
  const usersRef = db.collection('users');
  const adminUsersSnapshot = await usersRef.where('role', '==', 'admin').get();

  const updates: Promise<FirebaseFirestore.WriteResult>[] = [];

  for (const doc of adminUsersSnapshot.docs) {
    const userData = doc.data();
    const currentBarangayId = userData.barangayId;

    if (currentBarangayId && typeof currentBarangayId === 'string' && currentBarangayId.length > 0 && !/^[0-9]+$/.test(currentBarangayId)) {
      // Assuming currentBarangayId is a name, try to find its code
      const newBarangayCode = await getBarangayCodeFromName(currentBarangayId);

      if (newBarangayCode) {
        // Update Firestore document
        updates.push(doc.ref.update({ barangayId: newBarangayCode }));

        // Update custom claims
        const userRecord = await admin.auth().getUser(doc.id);
        await admin.auth().setCustomUserClaims(doc.id, { ...userRecord.customClaims, barangayId: newBarangayCode });
        logger.log(`Updated barangayId for user ${doc.id} from '${currentBarangayId}' to '${newBarangayCode}'`);
      } else {
        logger.warn(`Could not find code for barangay name: ${currentBarangayId} for user ${doc.id}`);
      }
    }
  }

  await Promise.all(updates);

  return { success: true, message: `Standardized barangay IDs for ${updates.length} admin users.` };
});

async function getCityMunicipalityNameFromCode(cityMunicipalityCode: string): Promise<string | undefined> {
  const typedAddressesData = await getAddressesData();

  for (const regionCode in typedAddressesData) {
    const regionData = typedAddressesData[regionCode];
    for (const provinceCode in regionData.province_list) {
      const provinceData = regionData.province_list[provinceCode];
      if (provinceData.municipality_list[cityMunicipalityCode]) {
        return provinceData.municipality_list[cityMunicipalityCode].name;
      }
    }
  }
  return undefined;
}

async function getBarangayNameFromCode(barangayCode: string): Promise<string | undefined> {
  const typedAddressesData = await getAddressesData();

  for (const regionCode in typedAddressesData) {
    const regionData = typedAddressesData[regionCode];
    for (const provinceCode in regionData.province_list) {
      const provinceData = regionData.province_list[provinceCode];
      for (const cityMunCode in provinceData.municipality_list) {
        const cityMunData = provinceData.municipality_list[cityMunCode];
        const foundBarangay = cityMunData.barangay_list.find(brgy => brgy.code === barangayCode);
        if (foundBarangay) {
          return foundBarangay.name;
        }
      }
    }
  }
  return undefined;
}

export const provisionUser = onCall({ cors: ['http://localhost:8100', 'http://localhost:8101', 'https://barangaymed.web.app', 'https://api-gy7oflie2a-uc.a.run.app'], secrets: [GMAIL_EMAIL, GMAIL_APP_PASSWORD] }, async (request) => {
  // 1. Authorization Check
  if (request.auth?.token.role !== 'superadmin' && request.auth?.token.email !== 'barangaymed@gmail.com') {
    logger.error("Attempt to provision user by non-authorized user:", { 
      uid: request.auth?.uid,
      email: request.auth?.token.email
    });
    throw new HttpsError(
      'permission-denied',
      'You are not authorized to perform this action.'
    );
  }

  const { contactEmail, role, barangayId, fullName, cityMunicipalityId } = request.data;

  // Superadmin confinement check
  if (request.auth?.token.role === 'superadmin') {
    const superadminCityMunicipalityId = request.auth.token.cityMunicipalityId;
    if (role === 'admin') {
      const newAdminBarangayCityMunId = await getCityMunicipalityIdFromBarangayId(barangayId);
      if (!superadminCityMunicipalityId || newAdminBarangayCityMunId !== superadminCityMunicipalityId) {
        throw new HttpsError(
          'permission-denied',
          'You can only create admins within your assigned city/municipality.'
        );
      }
    }
  }

  // 2. Input Validation
  if (!contactEmail || !role || !fullName) {
    throw new HttpsError('invalid-argument', 'Missing required fields: contactEmail, fullName, and role.');
  }
  if (!['admin', 'superadmin'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Role must be either \'admin\' or \'superadmin\'.');
  }
  if (role === 'admin' && !barangayId) {
    throw new HttpsError('invalid-argument', 'Barangay ID is required for admin role.');
  }
  if (role === 'superadmin' && !cityMunicipalityId) {
    throw new HttpsError('invalid-argument', 'City/Municipality ID is required for superadmin role.');
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
    const customClaims: { role: string; barangayId?: string; cityMunicipalityId?: string } = { role };
    if (role === 'admin') {
      customClaims.barangayId = barangayId;
    } else if (role === 'superadmin') {
      customClaims.cityMunicipalityId = cityMunicipalityId;
    }
    await admin.auth().setCustomUserClaims(userRecord.uid, customClaims);

    // 5. Create user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: generatedEmail,
      name: fullName,
      role: role,
      barangayId: role === 'admin' ? barangayId : null,
      cityMunicipalityId: role === 'superadmin' ? cityMunicipalityId : null,
      contactEmail: contactEmail, // Store the contact email for reference
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
    });

    // 6. Send credentials via email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_EMAIL.value(),
        pass: GMAIL_APP_PASSWORD.value(),
      },
    });

    let assignedLocation = '';
    if (role === 'admin') {
        const barangayName = await getBarangayNameFromCode(barangayId);
        assignedLocation = `<p><b>Assigned Barangay:</b> ${barangayName}</p>`;
    } else if (role === 'superadmin') {
        const cityName = await getCityMunicipalityNameFromCode(cityMunicipalityId);
        assignedLocation = `<p><b>Assigned City/Municipality:</b> ${cityName}</p>`;
    }

    const mailOptions = {
      from: `"BarangayMed+" <${GMAIL_EMAIL.value()}>`,
      to: contactEmail,
      subject: 'Your BarangayMed+ Account Credentials',
      html: `
        <p>Hello ${fullName},</p>
        <p>An account has been created for you on BarangayMed+.</p>
        <p><b>Role:</b> ${role}</p>
        ${assignedLocation}
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
    throw new HttpsError('internal', 'An error occurred while creating the user.');
  }
});


// Export the Express app as a Firebase Function
export const api = onRequest({ secrets: [GMAIL_EMAIL, GMAIL_APP_PASSWORD] }, app);
export { sendVerificationEmail } from './sendVerificationEmail.js';