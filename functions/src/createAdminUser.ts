import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin"; // Corrected import style
import { logger, config } from "firebase-functions"; // Import config
import * as nodemailer from 'nodemailer';
import { randomBytes } from "crypto";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load addressesData synchronously using fs.readFileSync
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addressesDataPath = path.resolve(__dirname, '../philippine-addresses.json');
const addressesData = JSON.parse(fs.readFileSync(addressesDataPath, 'utf8'));

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

function getCityMunicipalityIdFromBarangayId(barangayId: string): string | undefined {
  const typedAddressesData: AddressesDataType = addressesData as AddressesDataType;

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

/**
 * Callable function to provision a new admin or superadmin user.
 * Creates a user with a random email/password and sends credentials to a contact email.
 */
export const provisionUser = onCall(async (request) => {
  // 1. Authorization Check
  if (request.auth?.token.email !== 'barangaymed@gmail.com') {
    logger.error("Attempt to provision user by non-authorized user:", { 
      uid: request.auth?.uid,
      email: request.auth?.token.email
    });
    throw new HttpsError(
      'permission-denied',
      'You are not authorized to perform this action.'
    );
  }

  // Superadmin confinement check
  if (request.auth?.token.role === 'superadmin') {
    const superadminCityMunicipalityId = request.auth.token.cityMunicipalityId;
    if (role === 'admin') {
      const newAdminBarangayCityMunId = getCityMunicipalityIdFromBarangayId(barangayId);
      if (!superadminCityMunicipalityId || newAdminBarangayCityMunId !== superadminCityMunicipalityId) {
        throw new HttpsError(
          'permission-denied',
          'You can only create admins within your assigned city/municipality.'
        );
      }
    }
  }

  const { contactEmail, role, barangayId, fullName, cityMunicipalityId } = request.data;

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
        user: config().gmail.email,
        pass: config().gmail.app_password,
      },
    });

    const mailOptions = {
      from: `"BarangayMed+" <${config().gmail.email}>`,
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
    throw new HttpsError('internal', 'An error occurred while creating the user.');
  }
});