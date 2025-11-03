
import admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v2/https';

import { onCall, CallableRequest } from 'firebase-functions/v2/https';

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
  lotBlockHouseNo: string;
  streetName: string;
  subdivisionVillagePurok: string;
  contactNumber: string;
  idType: string;
  idFile: string; // This will be a base64 string
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
    lotBlockHouseNo,
    streetName,
    subdivisionVillagePurok,
    contactNumber,
    idType,
    idFile,
  } = data;

  // --- Validation ---
  if (!email || !password || !firstName || !lastName || !birthdate || !gender || !selectedBarangayCode || !contactNumber || !idType || !idFile) {
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

    // Upload ID file to Firebase Storage
    const bucket = admin.storage().bucket();
    const idFileName = `user_ids/${userRecord.uid}/${idType}-${Date.now()}`;
    const file = bucket.file(idFileName);
    const buffer = Buffer.from(idFile, 'base64');

    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg', // Assuming the file is a jpeg, you might want to make this dynamic
      },
    });
    const idFileUrl = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // A long time in the future
    });


    // --- Create Firestore Document ---
    const userData = {
      uid: userRecord.uid,
      email,
      firstName,
      middleName,
      lastName,
      suffix,
      name: [firstName, middleName, lastName].filter(Boolean).join(' ').toLowerCase(),
      birthdate,
      gender,
      role: 'user',
      verificationStatus: 'unverified',
      createdAt: new Date(),
      address: {
        region: selectedRegionCode,
        province: selectedProvinceCode,
        city: selectedCityMunCode,
        barangay: selectedBarangayCode,
        zipCode,
        lotBlockHouseNo,
        streetName,
        subdivisionVillagePurok,
      },
      contactNumber,
      id: {
        type: idType,
        url: idFileUrl[0],
      }
    };
    await admin.firestore().collection('users').doc(userRecord.uid).set(userData);

    // Send email verification
    const verificationLink = await admin.auth().generateEmailVerificationLink(email);
    // You would typically send this link in an email to the user
    // For this example, we'll just return it
    
    return { success: true, message: 'Resident account created successfully. A verification email has been sent.', verificationLink };

  } catch (error) {
    // Cleanup created user if process fails
    if (userRecord) {
      await admin.auth().deleteUser(userRecord.uid);
    }
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'An unexpected error occurred while creating the user.');
  }
});
