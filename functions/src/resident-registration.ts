
import admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';
import { onCall, CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { sendEmail } from './email.js';

const GMAIL_EMAIL = defineSecret('GMAIL_EMAIL');
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');

if (admin.apps.length === 0) {
  admin.initializeApp();
}

interface ResidentRegistrationData {
  email: string;
  password: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  birthdate: string;
  gender: string;
  selectedRegionCode: string;
  selectedProvinceCode: string;
  selectedCityMunCode: string;
  selectedBarangayCode: string;
  zipCode: string;
  lotBlkHouseNo: string;
  streetName: string;
  subdivisionVillagePurok: string;
  contactNumber: string;
}

export const createResidentAccount = onCall(async (request: CallableRequest<ResidentRegistrationData>) => {
  const { data, auth } = request;
  // Check if the user is a superadmin
  if (auth?.token.role !== 'superadmin') {
    throw new HttpsError('permission-denied', 'You are not authorized to perform this action.');
  }

  const {
    email,
    password,
    firstName,
    middleName,
    lastName,
    suffix,
    birthdate,
    gender,
    selectedRegionCode,
    selectedProvinceCode,
    selectedCityMunCode,
    selectedBarangayCode,
    zipCode,
    lotBlkHouseNo,
    streetName,
    subdivisionVillagePurok,
    contactNumber,
  } = data;

  // --- Validation ---
  if (!email || !password || !firstName || !lastName || !birthdate || !gender || !selectedBarangayCode || !contactNumber) {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  let userRecord;
  try {
    // Check if email is already in use
    try {
      await admin.auth().getUserByEmail(email);
      throw new HttpsError('already-exists', 'This email is already in use.');
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/user-not-found') {
        // Email is not in use, continue
      } else {
        throw error;
      }
    }

    // Create user in Firebase Auth
    userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false, // Email will be verified by the user
    });

    // Construct full address string
    const addressParts = [];
    if (lotBlkHouseNo) addressParts.push(lotBlkHouseNo);
    if (streetName) addressParts.push(streetName);
    if (subdivisionVillagePurok) addressParts.push(subdivisionVillagePurok);
    // Note: Barangay, City, Province, Region names are not available here, only codes.
    // These would ideally be resolved on the client or in a separate function if needed as names.
    // For now, using codes as per the provided users.ts structure for selected fields.
    addressParts.push(selectedBarangayCode, selectedCityMunCode, selectedProvinceCode, selectedRegionCode);
    if (zipCode) addressParts.push(zipCode);
    const fullAddress = addressParts.filter(Boolean).join(', ');

    // --- Create Firestore Document ---
interface UserData {
  uid: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  name: string;
  searchableName: string;
  birthdate: string;
  gender: string;
  role: string;
  verificationStatus: string;
  createdAt: Date;
  address: string;
  barangayId: string;
  contactNumber: string;
  selectedCityMunicipality: string;
  selectedProvince: string;
  selectedRegion: string;
  streetName: string;
  lotBlkHouseNo?: string;
  subdivisionVillagePurok?: string;
  zipCode: string;
  idVerificationType: string;
  idVerificationUrl: string;
}

    const userData: UserData = {
      uid: userRecord.uid,
      email,
      firstName,
      lastName,
      name: [firstName, middleName, lastName].filter(Boolean).join(' '),
      searchableName: [firstName, middleName, lastName].filter(Boolean).join(' ').toLowerCase(),
      birthdate,
      gender,
      role: 'user',
      verificationStatus: 'pending_email_verification',
      createdAt: new Date(),
      address: fullAddress,
      barangayId: selectedBarangayCode,
      contactNumber,
      selectedCityMunicipality: selectedCityMunCode,
      selectedProvince: selectedProvinceCode,
      selectedRegion: selectedRegionCode,
      streetName,
      zipCode,
      idVerificationType: '',
      idVerificationUrl: '',
    };

    if (middleName) userData.middleName = middleName;
    if (suffix) userData.suffix = suffix;
    if (lotBlkHouseNo) userData.lotBlkHouseNo = lotBlkHouseNo;
    if (subdivisionVillagePurok) userData.subdivisionVillagePurok = subdivisionVillagePurok;
    await admin.firestore().collection('users').doc(userRecord.uid).set(userData);

    return { success: true, uid: userRecord.uid };

  } catch (error) {
    // Cleanup created user if process fails
    if (userRecord) {
      await admin.auth().deleteUser(userRecord.uid);
    }
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error("Unexpected error in createResidentAccount:", error);
    throw new HttpsError('internal', 'An unexpected error occurred while creating the user.');
  }
});

export const finalizeResidentRegistration = onCall({ secrets: [GMAIL_EMAIL, GMAIL_APP_PASSWORD] }, async (request: CallableRequest<{ uid: string, downloadUrl: string, idType: string }>) => {
  console.log("finalizeResidentRegistration called.");
  const { data, auth } = request;
  console.log("Received data:", data);

  // Check if the user is a superadmin
  if (auth?.token.role !== 'superadmin') {
    console.error("Permission denied: Not a superadmin.");
    throw new HttpsError('permission-denied', 'You are not authorized to perform this action.');
  }

  const { uid, downloadUrl, idType } = data;

  if (!uid || !downloadUrl || !idType) {
    console.error("Invalid argument: Missing uid, downloadUrl, or idType.");
    throw new HttpsError('invalid-argument', 'Missing required fields: uid, downloadUrl, or idType.');
  }

  try {
    console.log(`Updating user ${uid} with ID URL: ${downloadUrl} and ID Type: ${idType}`);
    const userDocRef = admin.firestore().collection('users').doc(uid);

    await userDocRef.update({
      idVerificationUrl: downloadUrl,
      idVerificationType: idType,
      verificationStatus: 'pending_email_verification', // Corrected status
    });

    console.log("User document updated. Sending email verification.");
    // Send email verification
    const userRecord = await admin.auth().getUser(uid);
    const email = userRecord.email;
    if (email) {
      const verificationLink = await admin.auth().generateEmailVerificationLink(email);
      const subject = "BarangayMed+ Email Verification";
      const htmlContent = `
        <p>Dear ${userRecord.displayName || 'User'},</p>
        <p>Thank you for registering with BarangayMed+. Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationLink}">Verify Email Address</a></p>
        <p>If you did not create an account, please ignore this email.</p>
        <p>Sincerely,</p>
        <p>The BarangayMed+ Team</p>
      `;

      await sendEmail({
        to: email,
        subject: subject,
        html: htmlContent,
      }, GMAIL_EMAIL.value(), GMAIL_APP_PASSWORD.value());
    }

    return { success: true, message: 'Resident registration finalized successfully.' };

  } catch (error) {
    console.error("Unexpected error in finalizeResidentRegistration:", error);
    throw new HttpsError('internal', 'An unexpected error occurred while finalizing the registration.');
  }
});
